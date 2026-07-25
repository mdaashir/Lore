import { Router } from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../config/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createAuditLog } from '../utils/auditLog';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

router.use(authMiddleware);

function getWorkspaceRole(workspace: any, userId: string): string | null {
  const member = workspace.members?.find((m: any) => m.userId === userId);
  return member ? member.role : null;
}

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1 }),
    body('description').optional().trim(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const workspace = await prisma.workspace.create({
        data: {
          name,
          slug,
          description,
          members: {
            create: {
              userId: req.user!.id,
              role: 'OWNER',
            },
          },
        },
        include: { members: { include: { user: true } } },
      });

      await createAuditLog({
        req,
        action: 'WORKSPACE_CREATED',
        resourceType: 'workspace',
        resourceId: workspace.id,
        details: { name, slug },
        workspaceId: workspace.id,
      });

      res.status(201).json(workspace);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Workspace slug already exists' });
      }
      next(error);
    }
  }
);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: req.user!.id },
        },
      },
      include: { members: { include: { user: true } } },
    });

    res.json(workspaces);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', param('id').isUUID(), validateRequest, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.id as string },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const isMember = (workspace as any).members.some((m: any) => m.userId === req.user!.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/invite',
  param('id').isUUID(),
  body('email').isEmail(),
  body('role').isIn(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;

      const workspace = await prisma.workspace.findUnique({
        where: { id: req.params.id as string },
        include: { members: true },
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const inviter = (workspace as any).members.find((m: any) => m.userId === req.user!.id);
      if (!inviter || (inviter.role !== 'OWNER' && inviter.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingMember = (workspace as any).members.find((m: any) => m.userId === user.id);
      if (existingMember) {
        return res.status(409).json({ error: 'User already a member' });
      }

      const member = await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role,
        },
      });

      await createAuditLog({
        req,
        action: 'WORKSPACE_INVITE',
        resourceType: 'workspace',
        resourceId: workspace.id,
        details: { invitedUserId: user.id, role },
        workspaceId: workspace.id,
      });

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

import { Router } from 'express';
import { query } from 'express-validator';
import { prisma } from '../config/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  [
    query('workspaceId').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const { workspaceId, limit = 50, offset = 0 } = req.query;

      const where: any = { userId: req.user!.id };

      if (workspaceId) {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId as string },
          include: { members: true },
        });

        if (!workspace) {
          return res.status(404).json({ error: 'Workspace not found' });
        }

        const member = workspace.members.find((m: any) => m.userId === req.user!.id);
        if (!member) {
          return res.status(403).json({ error: 'Access denied' });
        }

        where.workspaceId = workspaceId as string;
      }

      const logs = await prisma.auditLog.findMany({
        where,
        skip: Number(offset),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });

      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

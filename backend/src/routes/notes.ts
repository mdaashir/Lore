import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { prisma } from '../config/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createAuditLog } from '../utils/auditLog';
import { updateNoteEmbedding } from '../services/embeddingService';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

router.use(authMiddleware);

function getWorkspaceRole(workspace: any, userId: string): string | null {
  const member = workspace.members?.find((m: any) => m.userId === userId);
  return member ? member.role : null;
}

function canWrite(role: string | null): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
}

function canRead(role: string | null): boolean {
  return role !== null;
}

router.post(
  '/',
  [
    body('title').trim().isLength({ min: 1 }),
    body('content').trim().isLength({ min: 1 }),
    body('workspaceId').isUUID(),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title, content, workspaceId } = req.body;

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: true },
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const role = getWorkspaceRole(workspace, req.user!.id);
      if (!canWrite(role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const note = await prisma.note.create({
        data: {
          title,
          content,
          workspaceId,
          authorId: req.user!.id,
        },
        include: { author: true },
      });

      await createAuditLog({
        req,
        action: 'NOTE_CREATED',
        resourceType: 'note',
        resourceId: note.id,
        details: { title },
        workspaceId,
      });

      updateNoteEmbedding(note.id, content).catch(console.error);

      res.status(201).json(note);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/',
  [query('workspaceId').isUUID(), query('limit').optional().isInt({ min: 1, max: 100 }), query('offset').optional().isInt({ min: 0 })],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, limit = 50, offset = 0, search } = req.query;

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId as string },
        include: { members: true },
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const role = getWorkspaceRole(workspace, req.user!.id);
      if (!canRead(role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const where: any = { workspaceId: workspaceId as string };

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } },
          { tags: { has: search as string } },
        ];
      }

      const notes = await prisma.note.findMany({
        where,
        skip: Number(offset),
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
        include: { author: true },
      });

      res.json(notes);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', param('id').isUUID(), validateRequest, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id as string },
      include: { author: true, workspace: { include: { members: true } } },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const role = getWorkspaceRole((note as any).workspace, req.user!.id);
    if (!canRead(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
});

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1 }),
    body('content').optional().trim().isLength({ min: 1 }),
  ],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title, content } = req.body;

      const note = await prisma.note.findUnique({
        where: { id: req.params.id as string },
        include: { workspace: { include: { members: true } } },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const role = getWorkspaceRole((note as any).workspace, req.user!.id);
      if (!canWrite(role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const updatedNote = await prisma.note.update({
        where: { id: req.params.id as string },
        data: { title, content },
        include: { author: true },
      });

      if (content) {
        await prisma.noteVersion.create({
          data: {
            noteId: note.id,
            title: note.title,
            content: note.content,
            authorId: req.user!.id,
          },
        });
        updateNoteEmbedding(note.id, content).catch(console.error);
      }

      await createAuditLog({
        req,
        action: 'NOTE_UPDATED',
        resourceType: 'note',
        resourceId: note.id,
        details: { title, contentChanged: !!content },
        workspaceId: note.workspaceId,
      });

      res.json(updatedNote);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', param('id').isUUID(), validateRequest, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id as string },
      include: { workspace: { include: { members: true } } },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const role = getWorkspaceRole((note as any).workspace, req.user!.id);
    if (!canWrite(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.note.delete({ where: { id: req.params.id as string } });

    await createAuditLog({
      req,
      action: 'NOTE_DELETED',
      resourceType: 'note',
      resourceId: note.id,
      details: { title: note.title },
      workspaceId: note.workspaceId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/share',
  [param('id').isUUID(), body('userId').isUUID(), body('permission').isIn(['READ', 'COMMENT', 'WRITE'])],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, permission } = req.body;

      const note = await prisma.note.findUnique({
        where: { id: req.params.id as string },
        include: { workspace: { include: { members: true } } },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const role = getWorkspaceRole((note as any).workspace, req.user!.id);
      if (!canWrite(role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const share = await prisma.noteShare.upsert({
        where: { noteId_userId: { noteId: note.id, userId } },
        update: { permission },
        create: { noteId: note.id, userId, permission },
      });

      await createAuditLog({
        req,
        action: 'NOTE_SHARED',
        resourceType: 'note',
        resourceId: note.id,
        details: { sharedWithUserId: userId, permission },
        workspaceId: note.workspaceId,
      });

      res.json(share);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

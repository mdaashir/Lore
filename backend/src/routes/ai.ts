import { Router, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../config/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { generateSummary, generateTags, answerQuestion } from '../services/aiService';
import { createAuditLog } from '../utils/auditLog';

const router = Router();

router.use(authMiddleware);

router.post(
  '/notes/:id/summarize',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = await prisma.note.findUnique({
        where: { id: req.params.id as string },
        include: { workspace: { include: { members: true } } },
      });

      if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }

      const member = (note as any).workspace?.members?.find((m: any) => m.userId === req.user!.id);
      if (!member) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const result = await generateSummary(note.content);

      await prisma.note.update({
        where: { id: note.id },
        data: { summary: result.summary },
      });

      await createAuditLog({
        req,
        action: 'NOTE_SUMMARIZED',
        resourceType: 'note',
        resourceId: note.id,
        workspaceId: note.workspaceId,
      });

      res.json(result);
    } catch (error: any) {
      if (error.message === 'OpenAI API key not configured') {
        res.status(503).json({ error: 'AI features not configured' });
        return;
      }
      next(error);
    }
  }
);

router.post(
  '/notes/:id/tags',
  [param('id').isUUID()],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const note = await prisma.note.findUnique({
        where: { id: req.params.id as string },
        include: { workspace: { include: { members: true } } },
      });

      if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }

      const member = (note as any).workspace?.members?.find((m: any) => m.userId === req.user!.id);
      if (!member) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const result = await generateTags(note.content);

      await prisma.note.update({
        where: { id: note.id },
        data: { tags: result.tags },
      });

      await createAuditLog({
        req,
        action: 'NOTE_TAGGED',
        resourceType: 'note',
        resourceId: note.id,
        workspaceId: note.workspaceId,
      });

      res.json(result);
    } catch (error: any) {
      if (error.message === 'OpenAI API key not configured') {
        res.status(503).json({ error: 'AI features not configured' });
        return;
      }
      next(error);
    }
  }
);

router.post(
  '/notes/:id/ask',
  [param('id').isUUID(), body('question').trim().isLength({ min: 1 })],
  validateRequest,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { question } = req.body;

      const note = await prisma.note.findUnique({
        where: { id: req.params.id as string },
        include: { workspace: { include: { members: true } } },
      });

      if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }

      const member = (note as any).workspace?.members?.find((m: any) => m.userId === req.user!.id);
      if (!member) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const answer = await answerQuestion(question, note.content);

      res.json({ answer });
    } catch (error: any) {
      if (error.message === 'OpenAI API key not configured') {
        res.status(503).json({ error: 'AI features not configured' });
        return;
      }
      next(error);
    }
  }
);

export default router;

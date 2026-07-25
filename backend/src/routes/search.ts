import { Router } from 'express';
import { query } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { semanticSearch } from '../services/embeddingService';
import { prisma } from '../config/prisma';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  [
    query('workspaceId').isUUID(),
    query('q').trim().isLength({ min: 1 }),
    query('semantic').optional().toBoolean(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const { workspaceId, q, semantic = false, limit = 10 } = req.query;

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

      if (semantic) {
        const results = await semanticSearch(q as string, workspaceId as string, Number(limit));
        return res.json({ results, mode: 'semantic' });
      }

      const results = await prisma.note.findMany({
        where: {
          workspaceId: workspaceId as string,
          OR: [
            { title: { contains: q as string, mode: 'insensitive' } },
            { content: { contains: q as string, mode: 'insensitive' } },
            { tags: { has: q as string } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: Number(limit),
        include: { author: true },
      });

      res.json({ results, mode: 'keyword' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

interface AuditLogParams {
  req: AuthRequest;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  workspaceId?: string;
}

export async function createAuditLog({
  req,
  action,
  resourceType,
  resourceId,
  details,
  workspaceId,
}: AuditLogParams) {
  if (!req.user) return;

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action,
      resourceType,
      resourceId,
      details: details ? JSON.stringify(details) : undefined,
      workspaceId,
    },
  });
}

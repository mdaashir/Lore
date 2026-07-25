export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  createdAt: string;
  user: User;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  summary: string | null;
  tags: string[];
  author: User;
}

export interface NoteShare {
  id: string;
  noteId: string;
  userId: string;
  permission: 'READ' | 'COMMENT' | 'WRITE';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  workspaceId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  createdAt: string;
  user: User;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

export interface TagResult {
  tags: string[];
}

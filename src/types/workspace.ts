export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  workspace_owner: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceWithRole extends Workspace {
  user_role: 'owner' | 'admin' | 'user';
  is_owner: boolean;
}

export interface WorkspaceUser {
  id: string;
  workspace_id: string;
  user_id: string | null;
  role: 'admin' | 'user';
  joined_at: string;
  is_ghost_user: boolean;
  ghost_user_name: string | null;
  ghost_user_email: string | null;
  // Campos adicionais para exibição
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  email?: string | null;
}
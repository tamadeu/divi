export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceUser {
  id: string;
  workspace_id: string;
  user_id: string | null;
  role: 'admin' | 'user';
  joined_at: string;
  is_ghost_user: boolean;
  ghost_user_name?: string;
  ghost_user_email?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface WorkspaceWithRole extends Workspace {
  user_role: 'admin' | 'user' | 'owner';
  is_owner: boolean;
}
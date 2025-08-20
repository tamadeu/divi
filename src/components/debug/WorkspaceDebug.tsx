import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const WorkspaceDebug = () => {
  const { session } = useSession();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching workspaces for user:', session.user.id);
      
      // Buscar workspaces
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*');
      
      console.log('📊 Workspaces query result:', { workspacesData, workspacesError });
      
      // Buscar workspace_users
      const { data: workspaceUsersData, error: workspaceUsersError } = await supabase
        .from('workspace_users')
        .select('*');
      
      console.log('👥 Workspace users query result:', { workspaceUsersData, workspaceUsersError });
      
      if (workspacesError) {
        setError(`Workspaces error: ${workspacesError.message}`);
      }
      
      if (workspaceUsersError) {
        setError(`Workspace users error: ${workspaceUsersError.message}`);
      }
      
      setWorkspaces(workspacesData || []);
      setWorkspaceUsers(workspaceUsersData || []);
      
    } catch (err: any) {
      console.error('💥 Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.user?.id]);

  if (!session?.user) {
    return <div>No session</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Workspace Debug</CardTitle>
          <Button onClick={fetchData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Current User ID:</h3>
              <code className="text-sm bg-gray-100 p-1 rounded">{session.user.id}</code>
            </div>
            
            {error && (
              <div className="text-red-600 bg-red-50 p-2 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            <div>
              <h3 className="font-semibold">Workspaces ({workspaces.length}):</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(workspaces, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold">Workspace Users ({workspaceUsers.length}):</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(workspaceUsers, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold">My Workspace Memberships:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(
                  workspaceUsers.filter(wu => wu.user_id === session.user.id),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceDebug;
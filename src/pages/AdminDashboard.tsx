import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchFolders } from "@/store/slices/fileSlice";
import { LogOut, Folder, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { folders, loading, error } = useAppSelector((state) => state.file);

  useEffect(() => {
    dispatch(fetchFolders());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
  };

  const handleFolderClick = (folderId: string) => {
    navigate(`/admin/folders/${folderId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, <span className="font-medium">{user.username}</span>
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Interview Recordings</h2>
              <p className="text-sm text-muted-foreground">
                {folders.length} recordings found
              </p>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  Loading recordings...
                </p>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center">
                <p className="font-medium">Error loading folders</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folderId) => (
                  <button
                    key={folderId}
                    onClick={() => handleFolderClick(folderId)}
                    className="group relative flex items-center space-x-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-background group-hover:border-accent">
                      <Folder className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium leading-none">
                        Recording
                      </p>
                      <p className="text-sm text-muted-foreground font-mono mt-1 truncate">
                        {folderId}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

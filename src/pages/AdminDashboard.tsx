import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchFolders } from "@/store/slices/fileSlice";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome back, {user.username}!
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Folders</h2>
          {loading && <p>Loading folders...</p>}
          {error && (
            <p className="text-red-500">Error loading folders: {error}</p>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map((folderId) => (
                <div
                  key={folderId}
                  onClick={() => handleFolderClick(folderId)}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <p className="text-sm font-mono">{folderId}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

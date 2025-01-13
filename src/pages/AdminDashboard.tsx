import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchFolders } from "@/store/slices/fileSlice";
import { LogOut, Folder, Loader2, FileAudio, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { folders, loading, error } = useAppSelector((state) => state.file);
  console.log(folders);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 shadow-md border-b border-indigo-100 dark:border-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Welcome back,{" "}
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {user.username}
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Interview Recordings
                </h2>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                  {folders.length} recordings available
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
                <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70">
                  Loading recordings...
                </p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg p-6 text-center my-8 border border-rose-200 dark:border-rose-800">
                <p className="font-semibold text-lg">Error loading folders</p>
                <p className="text-sm mt-2 text-rose-500 dark:text-rose-300">
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders.map((folderId) => (
                  <button
                    key={folderId}
                    onClick={() => handleFolderClick(folderId)}
                    className="group relative flex items-center space-x-4 rounded-xl border border-gray-200 dark:border-gray-700 p-5 transition-all 
                    hover:bg-indigo-50 dark:hover:bg-indigo-900/20 
                    hover:border-indigo-200 dark:hover:border-indigo-800 
                    hover:shadow-md hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20"
                  >
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg 
                      border border-gray-200 dark:border-gray-700 
                      bg-white dark:bg-gray-800 
                      group-hover:border-indigo-200 dark:group-hover:border-indigo-800 
                      group-hover:bg-indigo-100/50 dark:group-hover:bg-indigo-900/50 
                      transition-colors duration-200"
                    >
                      <FileAudio
                        className="h-7 w-7 text-indigo-600 dark:text-indigo-400 
                        group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p
                        className="text-sm font-medium leading-none text-gray-900 dark:text-white 
                        group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      >
                        Recording
                      </p>
                      <p
                        className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-2 truncate
                        group-hover:text-indigo-600/70 dark:group-hover:text-indigo-400/70"
                      >
                        {folderId.slice(0, 10)}
                      </p>
                    </div>
                    <ChevronRight
                      className="h-5 w-5 text-gray-400 dark:text-gray-500 
                      group-hover:text-indigo-500 dark:group-hover:text-indigo-400 
                      transition-colors"
                    />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;

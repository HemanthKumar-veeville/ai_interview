import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchFolders, deleteFolder } from "@/store/slices/fileSlice";
import {
  LogOut,
  Folder,
  Loader2,
  FileAudio,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/api-client";

interface Folder {
  name: string;
  createdDate: string;
}

interface Applicant {
  id: string;
  instanceId: string;
  name: string;
  role: string;
  careerGap: string;
  experience: string;
  resumeLink: string;
  coverLetterLink: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { folders, loading, error } = useAppSelector((state) => state.file);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [applicantsError, setApplicantsError] = useState<string | null>(null);
  console.log({ applicants });
  const fetchApplicants = async () => {
    try {
      setLoadingApplicants(true);
      setApplicantsError(null);
      const response = await apiClient.get("/applicants");
      console.log({ response });
      setApplicants(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      setApplicantsError("Failed to load applicants");
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    dispatch(fetchFolders());
    fetchApplicants();
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
  };

  const handleFolderClick = (folderId: string) => {
    navigate(`/admin/folders/${folderId}`);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async (folderId: string) => {
    try {
      await dispatch(deleteFolder(folderId)).unwrap();
      toast({
        title: "Success",
        description: "Recording deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete recording",
      });
    }
    setFolderToDelete(null);
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
        <Tabs defaultValue="recordings" className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="recordings">Interview Recordings</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
          </TabsList>

          <TabsContent value="recordings">
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
                    <p className="font-semibold text-lg">
                      Error loading folders
                    </p>
                    <p className="text-sm mt-2 text-rose-500 dark:text-rose-300">
                      {error}
                    </p>
                  </div>
                )}

                {!loading && !error && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(folders as Folder[]).map((folder) => (
                      <div
                        key={folder.name}
                        className="group relative flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 transition-all 
                        hover:border-indigo-200 dark:hover:border-indigo-800 
                        hover:shadow-md hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20
                        overflow-hidden"
                      >
                        <button
                          onClick={() => handleFolderClick(folder.name)}
                          className="flex items-center space-x-4 p-5 w-full
                          hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
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
                              {folder.name.slice(0, 10)}...
                            </p>
                            <p
                              className="text-xs text-gray-400 dark:text-gray-500 mt-1
                              group-hover:text-indigo-500/70 dark:group-hover:text-indigo-400/70"
                            >
                              {formatDateTime(folder.createdDate)}
                            </p>
                          </div>
                          <ChevronRight
                            className="h-5 w-5 text-gray-400 dark:text-gray-500 
                            group-hover:text-indigo-500 dark:group-hover:text-indigo-400 
                            transition-colors"
                          />
                        </button>
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderToDelete(folder.name);
                            }}
                            className="h-8 w-8 rounded-full text-gray-400 dark:text-gray-500
                              hover:text-rose-600 hover:bg-rose-50 
                              dark:hover:text-rose-400 dark:hover:bg-rose-900/20
                              transition-colors"
                            aria-label="Delete recording"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applicants">
            <Card className="border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Applicants
                    </h2>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                      {applicants.length} applicants registered
                    </p>
                  </div>
                </div>

                {loadingApplicants && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
                    <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70">
                      Loading applicants...
                    </p>
                  </div>
                )}

                {applicantsError && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg p-6 text-center my-8 border border-rose-200 dark:border-rose-800">
                    <p className="font-semibold text-lg">
                      Error loading applicants
                    </p>
                    <p className="text-sm mt-2 text-rose-500 dark:text-rose-300">
                      {applicantsError}
                    </p>
                  </div>
                )}

                {!loadingApplicants && !applicantsError && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 
                          hover:border-indigo-200 dark:hover:border-indigo-800 
                          hover:shadow-md hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20
                          bg-white dark:bg-gray-800 overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {applicant.name}
                              </h3>
                              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                                {applicant.role}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Applied on
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatDateTime(applicant.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Experience
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {applicant.experience}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Career Gap
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {applicant.careerGap}
                              </span>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-start space-x-4">
                              {applicant.resumeLink && (
                                <a
                                  href={applicant.resumeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 
                                    dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  <FileAudio className="h-4 w-4 mr-2" />
                                  Resume
                                </a>
                              )}
                              {applicant.coverLetterLink && (
                                <a
                                  href={applicant.coverLetterLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 
                                    dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  <FileAudio className="h-4 w-4 mr-2" />
                                  Cover Letter
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog
        open={!!folderToDelete}
        onOpenChange={() => setFolderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              recording and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => folderToDelete && handleDelete(folderToDelete)}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;

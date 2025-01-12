import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMergedVideo, clearMergedVideo } from "@/store/slices/fileSlice";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";

const FolderDetails = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { mergedVideoKey, mergeLoading, mergeError } = useAppSelector(
    (state) => state.file
  );

  useEffect(() => {
    if (folderId) {
      dispatch(fetchMergedVideo(folderId));
    }
    return () => {
      dispatch(clearMergedVideo());
    };
  }, [dispatch, folderId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Folder Details
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-mono">
            {folderId}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {mergeLoading && (
            <div className="text-center py-8">Loading video...</div>
          )}
          {mergeError && (
            <div className="text-red-500 text-center py-8">{mergeError}</div>
          )}
          {mergedVideoKey && !mergeLoading && !mergeError && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Interview Recording</h2>
              <video
                controls
                className="w-full rounded-lg"
                src={mergedVideoKey}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderDetails;

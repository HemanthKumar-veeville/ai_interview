import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMergedVideo, clearMergedVideo } from "@/store/slices/fileSlice";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Interview Recording
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            Folder ID: {folderId}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video Playback</CardTitle>
          </CardHeader>
          <CardContent>
            {mergeLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  Loading interview recording...
                </p>
              </div>
            )}

            {mergeError && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center">
                <p className="font-medium">Error loading video</p>
                <p className="text-sm mt-1">{mergeError}</p>
              </div>
            )}

            {mergedVideoKey && !mergeLoading && !mergeError && (
              <div className="space-y-4">
                <video
                  controls
                  className="w-full aspect-video rounded-lg border bg-black"
                  src={mergedVideoKey}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FolderDetails;

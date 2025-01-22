import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";

interface CameraCheckStepProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  error: string | null;
}

export const CameraCheckStep = ({ videoRef, error }: CameraCheckStepProps) => {
  useEffect(() => {
    const initializeVideo = async () => {
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          await videoRef.current.play();
        } catch (error) {
          console.error("Failed to play video:", error);
        }
      }
    };

    initializeVideo();
  }, [videoRef]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 p-2 rounded-lg">
          <Camera className="w-5 h-5 text-blue-600" />
        </div>
        <span className="text-lg font-medium text-gray-800">
          Camera Preview
        </span>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="relative rounded-lg bg-gradient-to-b from-gray-900 to-gray-800 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <p className="text-white text-center px-4 bg-red-500/10 backdrop-blur-sm py-2 rounded-lg border border-red-200/20">
                  {error}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

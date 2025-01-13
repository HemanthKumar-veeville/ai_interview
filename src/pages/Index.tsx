// pages/index.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VideoRecorder } from "@/components/VideoRecorder";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import { Chat } from "@/components/Chat";
import { useVideoRecording } from "@/hooks/useVideoRecording";

const Index = () => {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [showConsent, setShowConsent] = useState<boolean>(true);
  const { startRecording, stopRecording, isRecording, stream } =
    useVideoRecording();

  const handleConsent = () => {
    setHasConsent(true);
    setShowConsent(false);
    startRecording();
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isRecording) {
        event.preventDefault();
        event.returnValue =
          "Recording in progress. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (isRecording) {
        stopRecording();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, stream, stopRecording]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Welcome to AI Interview
            </DialogTitle>
            <DialogDescription className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              This application will record video and audio during your interview
              session. By clicking "I Agree", you consent to being recorded
              during this session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button onClick={handleConsent} className="w-full sm:w-auto">
              I Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hasConsent && (
        <div className="h-screen">
          <div className="hidden">
            <VideoRecorder />
          </div>

          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed w-40 h-28 top-4 right-4 flex items-center gap-3 bg-black/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg z-50"
            >
              <div className="relative">
                <video
                  autoPlay
                  muted
                  playsInline
                  className="w-24 h-24 rounded-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                  ref={(videoElement) => {
                    if (videoElement && stream) {
                      videoElement.srcObject = stream;
                    }
                  }}
                />
                <div className="absolute top-0 right-0 w-3 h-3">
                  <div className="w-full h-full bg-red-500 rounded-full animate-pulse" />
                </div>
              </div>
              <Video className="w-4 h-4" />
            </motion.div>
          )}

          <div className="h-full p-4">
            <div className="h-full flex flex-col max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                AI Interviewer
              </h2>
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <Chat />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

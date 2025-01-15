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
import { PreInterviewCheck } from "@/components/PreInterviewCheck";

const Index = () => {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [showConsent, setShowConsent] = useState<boolean>(true);
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const {
    startRecording,
    stopRecording,
    isRecording,
    stream,
    screenStream,
    cameraStream,
  } = useVideoRecording();

  const handleConsent = () => {
    setHasConsent(true);
    setShowConsent(false);
  };

  const handleSetupComplete = async () => {
    try {
      setSetupComplete(true);
    } catch (error) {
      console.error("Failed to complete setup:", error);
    }
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

      {hasConsent && !setupComplete && (
        <PreInterviewCheck
          onComplete={handleSetupComplete}
          startRecording={startRecording}
        />
      )}

      {hasConsent && setupComplete && (
        <div className="h-screen grid grid-cols-[400px,1fr] gap-4 p-4">
          <div className="relative h-full">
            <VideoRecorder
              stream={stream}
              screenStream={screenStream}
              cameraStream={cameraStream}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <Chat />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

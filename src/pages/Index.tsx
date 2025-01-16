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
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const checkHealth = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log("Health check response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
};

const Index = () => {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [showConsent, setShowConsent] = useState<boolean>(true);
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const {
    startRecording,
    stopRecording,
    isRecording,
    stream,
    screenStream,
    cameraStream,
    interviewerStream,
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

  useEffect(() => {
    const handleInterviewEnd = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (interviewerStream) {
        interviewerStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };

    window.addEventListener("endInterview", handleInterviewEnd);
    return () => {
      window.removeEventListener("endInterview", handleInterviewEnd);
    };
  }, [cameraStream, screenStream, interviewerStream]);

  useEffect(() => {
    const performHealthCheck = async () => {
      try {
        await checkHealth();
        setIsHealthy(true);
      } catch (error) {
        setIsHealthy(false);
        console.error("Service is not healthy:", error);
      }
    };

    performHealthCheck();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {!isHealthy ? (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600">
              Service Unavailable
            </h2>
            <p className="text-gray-600">
              Please try again later or contact support.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Dialog open={showConsent} onOpenChange={setShowConsent}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Welcome to AI Interview
                </DialogTitle>
                <DialogDescription className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  This application will record video and audio during your
                  interview session. By clicking "I Agree", you consent to being
                  recorded during this session.
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
            <div
              className={`h-screen ${
                window.isInterviewEnded
                  ? "flex justify-center items-center p-4"
                  : "grid grid-cols-[400px,1fr] gap-4 p-4"
              }`}
            >
              {!window.isInterviewEnded && (
                <div className="relative h-full">
                  <VideoRecorder
                    stream={stream}
                    screenStream={screenStream}
                    cameraStream={cameraStream}
                    interviewerStream={interviewerStream}
                  />
                </div>
              )}
              <div
                className={`flex flex-col ${
                  window.isInterviewEnded ? "w-full max-w-3xl" : ""
                }`}
              >
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                  <Chat
                    onInterviewEnd={() => {
                      window.isInterviewEnded = true;
                      // Force a re-render to update the layout
                      window.dispatchEvent(new Event("resize"));
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Index;

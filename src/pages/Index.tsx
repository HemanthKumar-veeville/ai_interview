// pages/index.tsx
import { useState, useEffect } from "react";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import axios from "axios";
import ConsentPage from "./ConsentPage";
import SetupPage from "./SetupPage";
import InterviewPage from "./InterviewPage";

const BASE_URL = import.meta.env.VITE_BASE_URL;

type PageState = "error" | "consent" | "setup" | "interview";

// Extend Window interface to include our custom property
declare global {
  interface Window {
    isInterviewEnded?: boolean;
  }
}

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
  const [currentPage, setCurrentPage] = useState<PageState>("consent");
  const [showConsent, setShowConsent] = useState<boolean>(true);
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const {
    startRecording,
    stopRecording,
    isRecording,
    stream,
    screenStream,
    cameraStream,
    interviewerStream,
    fileId,
  } = useVideoRecording();

  const handleConsent = () => {
    setShowConsent(false);
    setCurrentPage("setup");
  };

  const handleSetupComplete = async () => {
    try {
      setCurrentPage("interview");
    } catch (error) {
      console.error("Failed to complete setup:", error);
    }
  };

  const cleanupMediaResources = () => {
    // Only cleanup if we're actually recording
    if (isRecording) {
      stopRecording();
    }

    // Clean up all streams
    [stream, screenStream, cameraStream, interviewerStream].forEach(
      (mediaStream) => {
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => {
            if (track.readyState === "live") {
              track.stop();
            }
          });
        }
      }
    );
  };

  const handleInterviewEnd = () => {
    // Set interview ended flag first
    window.isInterviewEnded = true;

    // Clean up all media resources
    cleanupMediaResources();

    // Trigger UI update
    window.dispatchEvent(new Event("resize"));
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isRecording) {
        event.preventDefault();
        event.returnValue =
          "Recording in progress. Are you sure you want to leave?";
        return event.returnValue;
      }
      return undefined;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Only cleanup if the page is actually being unloaded
      if (window.isInterviewEnded) {
        cleanupMediaResources();
      }
    };
  }, [isRecording, stream, stopRecording]);

  useEffect(() => {
    const performHealthCheck = async () => {
      setIsLoading(true);
      try {
        await checkHealth();
        setIsHealthy(true);
      } catch (error) {
        setIsHealthy(false);
        setCurrentPage("error");
        console.error("Service is not healthy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    performHealthCheck();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isHealthy) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
              Service Unavailable
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please try again later or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentPage === "consent" && (
        <ConsentPage
          onConsent={handleConsent}
          showDialog={showConsent}
          onDialogChange={setShowConsent}
        />
      )}

      {currentPage === "setup" && (
        <SetupPage
          onComplete={handleSetupComplete}
          startRecording={startRecording}
        />
      )}

      {currentPage === "interview" && (
        <InterviewPage
          stream={stream}
          screenStream={screenStream}
          cameraStream={cameraStream}
          interviewerStream={interviewerStream}
          fileId={fileId}
          isInterviewEnded={!!window.isInterviewEnded}
          onInterviewEnd={handleInterviewEnd}
        />
      )}
    </>
  );
};

export default Index;

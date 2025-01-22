import { VideoRecorder } from "@/components/VideoRecorder";
import { Chat } from "@/components/Chat";
import { bg_01, bg_03 } from "@/assets/images";
import { useEffect, useState } from "react";

interface InterviewPageProps {
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  cameraStream: MediaStream | null;
  interviewerStream: MediaStream | null;
  fileId: string;
  isInterviewEnded: boolean;
  onInterviewEnd: () => void;
}

const InterviewPage = ({
  stream,
  screenStream,
  cameraStream,
  interviewerStream,
  fileId,
  isInterviewEnded,
  onInterviewEnd,
}: InterviewPageProps) => {
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    // Track screen sharing status
    if (screenStream) {
      setIsScreenShared(true);
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setIsScreenShared(false);
        };
      }
    } else {
      setIsScreenShared(false);
    }

    // Track all streams
    const allStreams = [
      { stream, name: "main" },
      { stream: screenStream, name: "screen" },
      { stream: cameraStream, name: "camera" },
      { stream: interviewerStream, name: "interviewer" },
    ];

    // Set up track ended listeners for all streams
    allStreams.forEach(({ stream, name }) => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            console.log(`${name} ${track.kind} track ended`);
            // You can add additional handling here if needed
          };
        });
      }
    });

    // Cleanup function
    return () => {
      // Clean up screen stream
      if (screenStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = null;
        }
      }

      // Clean up all other streams
      allStreams.forEach(({ stream }) => {
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.onended = null;
          });
        }
      });
    };
  }, [stream, screenStream, cameraStream, interviewerStream]);

  // Immediately stop all tracks and revoke permissions
  const stopAllTracksAndRevokePermissions = async () => {
    try {
      // Immediately disable and stop all tracks
      const allStreams = [
        stream,
        screenStream,
        cameraStream,
        interviewerStream,
      ];
      allStreams.forEach((mediaStream) => {
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => {
            track.enabled = false; // Immediately disable
            track.stop();
          });
        }
      });

      // Clear all video elements immediately
      document.querySelectorAll("video").forEach((video) => {
        video.srcObject = null;
        video.remove(); // Remove video elements entirely
      });

      // Force camera access revocation
      if (navigator.mediaDevices) {
        try {
          const finalStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          finalStream.getTracks().forEach((track) => {
            track.enabled = false;
            track.stop();
          });
        } catch (err) {
          console.log("Camera already stopped");
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  };

  // Add a handler for the end interview button
  const handleEndInterview = () => {
    setIsEnding(true);

    // Execute cleanup and call onInterviewEnd
    stopAllTracksAndRevokePermissions().then(() => {
      onInterviewEnd();
    });
  };

  // Update cleanup effect
  useEffect(() => {
    if (isInterviewEnded || isEnding) {
      const cleanupStreams = async () => {
        // Immediately disable and stop all tracks
        const allStreams = [
          stream,
          screenStream,
          cameraStream,
          interviewerStream,
        ];
        allStreams.forEach((mediaStream) => {
          if (mediaStream) {
            mediaStream.getTracks().forEach((track) => {
              track.enabled = false; // Immediately disable
              track.stop();
            });
          }
        });

        // Clear video elements
        const videos = document.querySelectorAll("video");
        videos.forEach((video) => {
          video.srcObject = null;
          video.remove(); // Remove video elements
        });

        // Additional cleanup...
      };

      cleanupStreams();
    }

    return () => {
      if (isInterviewEnded || isEnding) {
        stopAllTracksAndRevokePermissions();
      }
    };
  }, [
    isInterviewEnded,
    isEnding,
    stream,
    screenStream,
    cameraStream,
    interviewerStream,
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="w-full h-screen fixed inset-0 flex items-center justify-center bg-[#f5f5f5]"
        style={{
          backgroundImage: `url(${isInterviewEnded ? bg_01 : bg_03})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-blue-600/10" />
      </div>

      <div className="relative flex-1 z-10">
        <div
          className={`h-screen ${
            isInterviewEnded
              ? "flex justify-center items-center p-4"
              : "grid grid-cols-[minmax(360px,_400px),1fr] gap-5 p-5"
          }`}
        >
          {!isInterviewEnded && (
            <div className="relative h-full flex items-center">
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
              isInterviewEnded ? "w-full max-w-3xl" : ""
            }`}
          >
            <div className="flex-1 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
              <Chat
                onInterviewEnd={handleEndInterview}
                instanceId={fileId}
                isScreenShared={isScreenShared}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;

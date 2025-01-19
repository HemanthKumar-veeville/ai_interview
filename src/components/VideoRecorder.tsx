import React, { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface VideoRecorderProps {
  stream?: MediaStream | null;
  screenStream?: MediaStream | null;
  cameraStream?: MediaStream | null;
  interviewerStream?: MediaStream | null;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  stream,
  screenStream,
  cameraStream,
  interviewerStream,
}) => {
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const interviewerVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (interviewerVideoRef.current && interviewerStream) {
      interviewerVideoRef.current.srcObject = interviewerStream;

      const playVideo = async () => {
        try {
          await interviewerVideoRef.current?.play();
        } catch (err) {
          console.error("Failed to play interviewer video:", err);
        }
      };

      playVideo();
    }
  }, [interviewerStream]);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <div className="space-y-4">
      {/* Interviewer video (Riya) */}
      <Card className="relative overflow-hidden">
        <video
          ref={interviewerVideoRef}
          autoPlay
          playsInline
          loop
          className="w-full aspect-video object-cover bg-gradient-to-r from-gray-900 to-gray-800"
        />
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white font-medium text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          TARA
        </div>
      </Card>

      {/* Applicant video */}
      <Card className="relative overflow-hidden">
        <video
          ref={cameraVideoRef}
          autoPlay
          playsInline
          className="w-full aspect-video object-cover bg-gradient-to-r from-gray-900 to-gray-800"
          muted={true}
        />
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white font-medium text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          You
        </div>
      </Card>
    </div>
  );
};

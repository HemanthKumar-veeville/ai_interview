import React, { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface VideoRecorderProps {
  stream?: MediaStream | null;
  screenStream?: MediaStream | null;
  cameraStream?: MediaStream | null;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  stream,
  screenStream,
  cameraStream,
}) => {
  const cameraVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <div className="space-y-4">
      {/* Camera video */}
      <Card className="overflow-hidden">
        <video
          ref={cameraVideoRef}
          autoPlay
          playsInline
          className="w-full aspect-video object-cover bg-black"
          muted={true}
        />
      </Card>
    </div>
  );
};

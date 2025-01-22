import React, { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { tara } from "@/assets/images"; // Make sure to add the interviewer image to your assets

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

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <div className="h-full flex flex-col justify-center space-y-5">
      {/* Interviewer photo (TARA) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden rounded-2xl border border-white/20 shadow-xl bg-gradient-to-br from-gray-900/95 to-gray-800/95">
          <img
            src={tara}
            alt="TARA - AI Interviewer"
            className="w-full aspect-video object-contain"
            style={{
              backgroundImage: `url(${tara})`,
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-lg text-white text-xs font-medium flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            TARA
          </div>
        </Card>
      </motion.div>

      {/* Applicant video */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden rounded-2xl border border-white/20 shadow-xl bg-gradient-to-br from-gray-900/95 to-gray-800/95">
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            className="w-full aspect-video object-cover"
            muted={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-lg text-white text-xs font-medium flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            You
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

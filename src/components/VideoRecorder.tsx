import { useEffect, useRef } from "react";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Video } from "lucide-react";

export const VideoRecorder = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isRecording, stream, error } = useVideoRecording();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className="overflow-hidden h-full">
      <div className="relative h-full">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover bg-gray-900"
        />
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg"
          >
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="font-medium">Recording</span>
          </motion.div>
        )}
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full"
          >
            <Video className="w-4 h-4" />
            <span className="text-sm">Video is being recorded</span>
          </motion.div>
        )}
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
        {error && (
          <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
        )}
      </div>
    </Card>
  );
};
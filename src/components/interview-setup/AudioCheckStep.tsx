import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface AudioCheckStepProps {
  microphoneLevel: number;
  isTestRecording?: boolean;
  testAudioUrl?: string | null;
  onStartTestRecording?: () => void;
  onStopTestRecording?: () => void;
}

export const AudioCheckStep = ({
  microphoneLevel,
  isTestRecording = false,
  testAudioUrl = null,
  onStartTestRecording,
  onStopTestRecording,
}: AudioCheckStepProps) => (
  <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
    <CardContent className="space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Microphone Level
          </span>
          <Volume2 className="w-4 h-4 text-blue-500" />
        </div>
        <div className="relative">
          <Progress
            value={Math.min((microphoneLevel / 128) * 100, 100)}
            className="h-3 bg-gray-100"
            indicatorClassName="bg-gradient-to-r from-blue-400 to-blue-600"
          />
          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-blue-500/20 rounded-full"
            animate={{
              opacity: microphoneLevel > 20 ? 1 : 0.3,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p
          className={`text-sm mt-2 ${
            microphoneLevel > 20 ? "text-green-600" : "text-gray-500"
          }`}
        >
          {microphoneLevel > 20
            ? "Audio level is good"
            : "Please speak to test your microphone"}
        </p>
      </div>

      {/* Test Recording Controls */}
      {onStartTestRecording && onStopTestRecording && (
        <div className="space-y-4">
          <Button
            onClick={
              isTestRecording ? onStopTestRecording : onStartTestRecording
            }
            variant={isTestRecording ? "destructive" : "default"}
            className="w-full"
          >
            {isTestRecording ? "Stop Test Recording" : "Start Test Recording"}
          </Button>

          {testAudioUrl && !isTestRecording && (
            <audio
              src={testAudioUrl}
              controls
              className="w-full"
              style={{ height: "40px" }}
            />
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  Mic,
  Monitor,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SystemCheckStepProps {
  stream: MediaStream | null;
}

export const SystemCheckStep = ({ stream }: SystemCheckStepProps) => {
  // Validate camera requirements
  const validateCamera = () => {
    if (!stream) return false;
    const videoTracks = stream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].readyState === "live";
  };

  // Validate microphone requirements
  const validateMicrophone = () => {
    if (!stream) return false;
    const audioTracks = stream.getAudioTracks();
    return audioTracks.length > 0 && audioTracks[0].readyState === "live";
  };

  // Get status indicators with proper messages
  const getCameraStatus = () => ({
    isValid: validateCamera(),
    message: validateCamera()
      ? "Camera is working properly"
      : "Camera is not properly configured",
  });

  const getMicrophoneStatus = () => ({
    isValid: validateMicrophone(),
    message: validateMicrophone()
      ? "Microphone is working properly"
      : "Microphone is not properly configured",
  });

  const cameraStatus = getCameraStatus();
  const microphoneStatus = getMicrophoneStatus();

  // Add browser compatibility check
  const getBrowserCompatibility = () => {
    const ua = navigator.userAgent;
    const browserInfo = {
      name: "",
      isCompatible: true,
      warning: "",
    };

    if (ua.includes("Chrome")) {
      browserInfo.name = "Chrome";
    } else if (ua.includes("Firefox")) {
      browserInfo.name = "Firefox";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      browserInfo.name = "Safari";
      browserInfo.warning = "Some features may have limited support in Safari";
    } else if (ua.includes("Edge")) {
      browserInfo.name = "Edge";
    } else {
      browserInfo.name = "Other";
      browserInfo.isCompatible = false;
      browserInfo.warning = "Your browser may not support all features";
    }

    return browserInfo;
  };

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 transition-colors hover:bg-blue-50/70">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">Camera Access</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              {cameraStatus.isValid ? (
                <CheckCircle className="text-green-500 h-5 w-5" />
              ) : (
                <AlertCircle className="text-red-500 h-5 w-5" />
              )}
            </TooltipTrigger>
            <TooltipContent className="bg-white/90 backdrop-blur-sm border-blue-100">
              <p className="text-sm">{cameraStatus.message}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 transition-colors hover:bg-blue-50/70">
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">Microphone Access</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              {microphoneStatus.isValid ? (
                <CheckCircle className="text-green-500 h-5 w-5" />
              ) : (
                <AlertCircle className="text-red-500 h-5 w-5" />
              )}
            </TooltipTrigger>
            <TooltipContent className="bg-white/90 backdrop-blur-sm border-blue-100">
              <p className="text-sm">{microphoneStatus.message}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 transition-colors hover:bg-blue-50/70">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">Screen Sharing</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-blue-400 hover:text-blue-500 transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="bg-white/90 backdrop-blur-sm border-blue-100">
              <p className="text-gray-700">
                Screen sharing will be requested when you start the interview
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Add browser compatibility check */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 transition-colors hover:bg-blue-50/70">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">Browser Compatibility</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              {getBrowserCompatibility().isCompatible ? (
                <CheckCircle className="text-green-500 h-5 w-5" />
              ) : (
                <AlertCircle className="text-yellow-500 h-5 w-5" />
              )}
            </TooltipTrigger>
            <TooltipContent className="bg-white/90 backdrop-blur-sm border-blue-100">
              <p className="text-sm">
                {getBrowserCompatibility().warning ||
                  `Using ${getBrowserCompatibility().name} - Fully Compatible`}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
};

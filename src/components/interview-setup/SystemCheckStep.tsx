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

export const SystemCheckStep = ({ stream }: SystemCheckStepProps) => (
  <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
    <CardContent className="space-y-4 pt-6">
      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 transition-colors hover:bg-blue-50/70">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-blue-500" />
          <span className="text-gray-700">Camera Access</span>
        </div>
        {stream?.getVideoTracks().length ? (
          <CheckCircle className="text-green-500 h-5 w-5" />
        ) : (
          <AlertCircle className="text-red-400 h-5 w-5" />
        )}
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100/50 transition-colors hover:bg-blue-50/70">
        <div className="flex items-center gap-3">
          <Mic className="w-5 h-5 text-blue-500" />
          <span className="text-gray-700">Microphone Access</span>
        </div>
        {stream?.getAudioTracks().length ? (
          <CheckCircle className="text-green-500 h-5 w-5" />
        ) : (
          <AlertCircle className="text-red-400 h-5 w-5" />
        )}
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
    </CardContent>
  </Card>
);

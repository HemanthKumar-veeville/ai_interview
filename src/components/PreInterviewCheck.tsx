import React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Camera,
  Mic,
  Sun,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Volume2,
  LucideIcon,
  HelpCircle,
  PlayCircle,
  Monitor,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreInterviewCheckProps {
  onComplete: () => Promise<void>;
  startRecording: (stream: MediaStream) => Promise<void>;
}

type Step = {
  title: string;
  icon: LucideIcon;
  description: string;
  content: JSX.Element;
};

export const PreInterviewCheck: React.FC<PreInterviewCheckProps> = ({
  onComplete,
  startRecording,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [microphoneLevel, setMicrophoneLevel] = useState<number>(0);
  const [isTestRecording, setIsTestRecording] = useState(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize camera and audio setup
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!mounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Setup audio analysis
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;

        if (mounted) {
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          updateMicrophoneLevel();
        } else {
          audioContext.close();
        }
      } catch (err) {
        if (mounted) {
          setError(
            "Failed to access camera or microphone. Please check your permissions."
          );
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const updateMicrophoneLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume level
      const average =
        dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      setMicrophoneLevel(average);

      animationFrameRef.current = requestAnimationFrame(updateMicrophoneLevel);
    }
  };

  const handleTestRecording = () => {
    if (!stream) return;

    if (!isTestRecording) {
      // Start recording
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setTestAudioUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsTestRecording(true);
    } else {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsTestRecording(false);
    }
  };

  const handleComplete = async () => {
    try {
      if (stream) {
        await startRecording(stream);
        await onComplete();
      } else {
        setError("No media stream available");
      }
    } catch (err) {
      setError("Failed to start recording. Please try again.");
      throw err;
    }
  };

  const steps: Step[] = [
    {
      title: "Camera Check",
      icon: Camera,
      description:
        "Ensure your camera is working and you're centered in the frame.",
      content: (
        <Card className="overflow-hidden">
          <div className="relative rounded-lg bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-center px-4">{error}</p>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Tips for good video quality:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Ensure proper lighting on your face</li>
                <li>Position yourself in the center</li>
                <li>Keep a neutral background</li>
              </ul>
            </p>
          </CardContent>
        </Card>
      ),
    },
    {
      title: "Audio Check",
      icon: Mic,
      description: "Test your microphone and ensure clear audio quality",
      content: (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Microphone Level</span>
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <Progress
                  value={Math.min((microphoneLevel / 128) * 100, 100)}
                  className="h-3"
                />
                <motion.div
                  className="absolute top-0 left-0 w-full h-full bg-primary/20"
                  animate={{
                    opacity: microphoneLevel > 20 ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {microphoneLevel > 20
                  ? "Audio level is good"
                  : "Please speak to test your microphone"}
              </p>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      title: "System Check",
      icon: Sun,
      description: "Final verification of your system settings.",
      content: (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-muted-foreground" />
                <span>Camera Access</span>
              </div>
              {stream?.getVideoTracks().length ? (
                <CheckCircle className="text-green-500 h-5 w-5" />
              ) : (
                <AlertCircle className="text-red-500 h-5 w-5" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-muted-foreground" />
                <span>Microphone Access</span>
              </div>
              {stream?.getAudioTracks().length ? (
                <CheckCircle className="text-green-500 h-5 w-5" />
              ) : (
                <AlertCircle className="text-red-500 h-5 w-5" />
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-muted-foreground" />
                <span>Screen Sharing</span>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Screen sharing will be requested when you start the interview
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Welcome to Your Interview
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Let's make sure everything is working properly before we begin. This
          should take about 2-3 minutes.
        </p>
      </div>

      <Progress
        value={(currentStep / (steps.length - 1)) * 100}
        className="h-2"
      />

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          {steps[currentStep].icon &&
            React.createElement(steps[currentStep].icon, {
              className: "w-8 h-8 text-primary",
            })}
          <div>
            <h2 className="text-2xl font-semibold">
              {steps[currentStep].title}
            </h2>
            <p className="text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>
        </div>
        {steps[currentStep].content}
      </motion.div>

      <div className="flex justify-between mt-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentStep((current) => Math.max(0, current - 1))
              }
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go back to previous step</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={async () => {
                try {
                  if (currentStep === steps.length - 1) {
                    await handleComplete();
                  } else {
                    setCurrentStep((current) => current + 1);
                  }
                } catch (err) {
                  // Error is handled by handleComplete
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              {currentStep === steps.length - 1 ? "Start Interview" : "Next"}
              {currentStep !== steps.length - 1 && (
                <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {currentStep === steps.length - 1
              ? "Begin your interview"
              : "Continue to next step"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Need help? Click the help icon in the corner for support</p>
      </div>
    </div>
  );
};

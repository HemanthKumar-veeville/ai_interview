import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Camera, Mic, Sun, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CameraCheckPage } from "./interview-setup/pages/CameraCheckPage";
import { AudioCheckPage } from "./interview-setup/pages/AudioCheckPage";
import { SystemCheckPage } from "./interview-setup/pages/SystemCheckPage";
import { SetupStep } from "@/pages/SetupPage";

interface PreInterviewCheckProps {
  onComplete: () => Promise<void>;
  startRecording: (stream: MediaStream) => Promise<void>;
  currentStep: SetupStep;
  onStepChange: (step: SetupStep) => void;
}

export const PreInterviewCheck: React.FC<PreInterviewCheckProps> = ({
  onComplete,
  startRecording,
  currentStep,
  onStepChange,
}) => {
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

  // Convert the numeric steps to SetupStep type
  const getStepName = (step: number): SetupStep => {
    switch (step) {
      case 0:
        return "camera";
      case 1:
        return "audio";
      case 2:
        return "system";
      default:
        return "complete";
    }
  };

  // Convert SetupStep type to numeric index
  const getStepNumber = (step: SetupStep): number => {
    switch (step) {
      case "camera":
        return 0;
      case "audio":
        return 1;
      case "system":
        return 2;
      case "complete":
        return 3;
    }
  };

  const currentStepNumber = getStepNumber(currentStep);

  switch (currentStepNumber) {
    case 0:
      return (
        <CameraCheckPage
          videoRef={videoRef}
          error={error}
          onNext={() => onStepChange("audio")}
        />
      );
    case 1:
      return (
        <AudioCheckPage
          microphoneLevel={microphoneLevel}
          onNext={() => onStepChange("system")}
          onPrevious={() => onStepChange("camera")}
        />
      );
    case 2:
      return (
        <SystemCheckPage
          stream={stream}
          onNext={() => {
            onStepChange("complete");
            handleComplete();
          }}
          onPrevious={() => onStepChange("audio")}
        />
      );
    default:
      return null;
  }
};

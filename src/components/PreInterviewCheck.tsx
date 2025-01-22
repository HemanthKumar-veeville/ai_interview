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

// Add these utility functions at the top
const checkDeviceSupport = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Your browser doesn't support media devices access");
  }

  try {
    // Check if devices are available
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some((device) => device.kind === "videoinput");
    const hasMicrophone = devices.some(
      (device) => device.kind === "audioinput"
    );

    if (!hasCamera) throw new Error("No camera detected");
    if (!hasMicrophone) throw new Error("No microphone detected");

    return { hasCamera, hasMicrophone };
  } catch (error) {
    throw new Error("Failed to check device support: " + error.message);
  }
};

const requestPermissions = async () => {
  try {
    // Request permissions one at a time for better browser compatibility
    // First request audio
    await navigator.mediaDevices.getUserMedia({ audio: true });

    // Then request video
    await navigator.mediaDevices.getUserMedia({ video: true });

    // Check if screen capture is supported
    if ("getDisplayMedia" in navigator.mediaDevices) {
      // Don't actually request screen sharing here, just check support
      return true;
    } else if (
      (navigator.mediaDevices as any).getUserMedia &&
      (navigator as any).mediaDevices.supportedConstraints.mediaSource
    ) {
      // Fallback for older browsers
      return true;
    }

    return true;
  } catch (error) {
    throw new Error("Permission denied: " + error.message);
  }
};

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

  // Add new state for permissions
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [deviceSupport, setDeviceSupport] = useState({
    hasCamera: false,
    hasMicrophone: false,
  });

  // Add mounted ref to handle cleanup properly
  const mounted = useRef(true);

  // Initialize device check and permissions
  useEffect(() => {
    const initializeDevices = async () => {
      try {
        const support = await checkDeviceSupport();
        setDeviceSupport(support);

        await requestPermissions();
        setPermissionsGranted(true);

        // Browser-specific constraints
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
            // Add Safari-specific constraints
            ...(navigator.userAgent.includes("Safari") &&
              !navigator.userAgent.includes("Chrome") && {
                frameRate: { max: 30 },
              }),
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Different sample rates for different browsers
            sampleRate: navigator.userAgent.includes("Firefox") ? 44100 : 48000,
            channelCount: 2,
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        setStream(mediaStream);
        await initializeVideoPreview(mediaStream);
        await initializeAudioAnalysis(mediaStream);
      } catch (error) {
        handleError(error as Error, "Device initialization error");
      }
    };

    initializeDevices();

    return () => {
      mounted.current = false;
      cleanupMediaStreams();
      cleanupAudioResources();
    };
  }, []);

  // Update video preview initialization
  const initializeVideoPreview = async (mediaStream: MediaStream) => {
    if (!videoRef.current || !mounted.current) return;

    try {
      videoRef.current.srcObject = null; // Clear existing stream
      videoRef.current.srcObject = mediaStream;

      // Wait for loadedmetadata event before playing
      await new Promise((resolve) => {
        if (!videoRef.current) return;
        videoRef.current.onloadedmetadata = resolve;
      });

      if (mounted.current && videoRef.current) {
        await videoRef.current.play();
      }
    } catch (error) {
      if (mounted.current) {
        handleError(error as Error, "Video preview error");
      }
    }
  };

  // Update cleanup in useEffect
  useEffect(() => {
    return () => {
      mounted.current = false;
      cleanupMediaStreams();
      cleanupAudioResources();
    };
  }, []);

  // Update the visibility change handler to also handle step changes
  useEffect(() => {
    const reinitializeStream = async () => {
      if (!mounted.current) return;

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 2,
          },
        });

        if (mounted.current) {
          setStream(mediaStream);
          if (currentStep === "camera") {
            await initializeVideoPreview(mediaStream);
          }
          if (currentStep === "audio") {
            await initializeAudioAnalysis(mediaStream);
          }
        }
      } catch (error) {
        if (mounted.current) {
          handleError(error as Error, "Failed to reinitialize stream");
        }
      }
    };

    // Reinitialize stream when returning to camera or audio step
    if (currentStep === "camera" || currentStep === "audio") {
      reinitializeStream();
    }

    return () => {
      if (currentStep === "camera") {
        cleanupMediaStreams();
      }
      if (currentStep === "audio") {
        cleanupAudioResources();
      }
    };
  }, [currentStep]);

  // Update audio analysis initialization
  const initializeAudioAnalysis = async (mediaStream: MediaStream) => {
    if (!mounted.current) return;

    try {
      // Reuse existing audio context if available
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      } else if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Create new analyzer node
      const analyser = audioContextRef.current.createAnalyser();
      const microphone =
        audioContextRef.current.createMediaStreamSource(mediaStream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Start the level monitoring
      if (mounted.current) {
        updateMicrophoneLevel();
      }
    } catch (error) {
      if (mounted.current) {
        handleError(error as Error, "Audio analysis error");
      }
    }
  };

  // Update the test recording functionality
  const startTestRecording = () => {
    if (!stream) return;

    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      setTestAudioUrl(audioUrl);
      setIsTestRecording(false);
    };

    mediaRecorder.start();
    setIsTestRecording(true);
  };

  const stopTestRecording = () => {
    if (mediaRecorderRef.current && isTestRecording) {
      mediaRecorderRef.current.stop();
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

  const cleanupAudioResources = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (testAudioUrl) {
      URL.revokeObjectURL(testAudioUrl);
    }
    // Don't close audioContext, just suspend it
    if (audioContextRef.current?.state === "running") {
      audioContextRef.current?.suspend();
    }
  };

  const cleanupMediaStreams = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        if (track.readyState === "live") {
          track.stop();
        }
      });
      setStream(null); // Clear the stream state
    }
  };

  const handleError = (error: Error, context: string) => {
    console.error(`${context}:`, error);
    setError(error.message);
  };

  const handleNext = async () => {
    await onStepChange("complete");
    await handleComplete();
  };

  // Update the microphone level monitoring function
  const updateMicrophoneLevel = () => {
    if (!analyserRef.current || !mounted.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume level with improved sensitivity
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    // Scale the value to be more responsive (adjust multiplier as needed)
    const scaledLevel = Math.min(100, average * 1.5);

    setMicrophoneLevel(scaledLevel);

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateMicrophoneLevel);
  };

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
          isTestRecording={isTestRecording}
          testAudioUrl={testAudioUrl}
          onStartTestRecording={startTestRecording}
          onStopTestRecording={stopTestRecording}
          onNext={() => onStepChange("system")}
          onPrevious={() => onStepChange("camera")}
        />
      );
    case 2:
      return (
        <SystemCheckPage
          stream={stream}
          onNext={handleNext}
          onPrevious={() => onStepChange("audio")}
        />
      );
    default:
      return null;
  }
};

// Add proper type definitions for window.AudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

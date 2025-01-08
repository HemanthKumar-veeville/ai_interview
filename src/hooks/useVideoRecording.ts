import { useState, useEffect, useCallback } from "react";
import { VideoRecordingState } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export const useVideoRecording = () => {
  const { toast } = useToast();
  const [state, setState] = useState<VideoRecordingState>({
    isRecording: false,
    stream: null,
    error: null,
    mediaRecorder: null,
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        console.log("Recording stopped, blob created:", blob);
      };

      mediaRecorder.start();

      setState({
        isRecording: true,
        stream,
        error: null,
        mediaRecorder,
      });

      toast({
        title: "Recording Started",
        description: "Your interview is now being recorded.",
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to start recording",
      }));
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start recording. Please check your camera permissions.",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (state.mediaRecorder && state.stream) {
      state.mediaRecorder.stop();
      state.stream.getTracks().forEach((track) => track.stop());
      setState({
        isRecording: false,
        stream: null,
        error: null,
        mediaRecorder: null,
      });
      toast({
        title: "Recording Stopped",
        description: "Your interview recording has been saved.",
      });
    }
  }, [state.mediaRecorder, state.stream, toast]);

  useEffect(() => {
    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      if (state.isRecording) {
        stopRecording();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [state.isRecording, state.stream, stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
  };
};
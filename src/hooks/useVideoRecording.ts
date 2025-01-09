import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // Import uuid for generating unique IDs

const BASE_URL = "http://localhost:3000";

export const useVideoRecording = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileIdRef = useRef<string | null>(null); // Ref to store the unique file ID

  const startRecording = useCallback(async () => {
    try {
      // Generate a unique ID for the recording session
      fileIdRef.current = uuidv4();

      // Capture camera and audio
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Capture screen
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Combine camera and screen streams
      const combinedStream = new MediaStream([
        ...cameraStream.getVideoTracks(),
        ...screenStream.getVideoTracks(),
        ...cameraStream.getAudioTracks(),
      ]);

      setStream(combinedStream);

      // Initialize MediaRecorder with the combined stream
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp9,opus",
      });

      // Handle data available event
      mediaRecorderRef.current.ondataavailable = async (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          await uploadChunk(event.data); // Upload the chunk immediately
        }
      };

      // Handle recording stop event
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        console.log("Recording stopped, blob created:", blob);
      };

      // Start recording
      mediaRecorderRef.current.start(10000); // Create a chunk every 10 seconds
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Your interview is now being recorded.",
      });
    } catch (err) {
      setError("Failed to start recording. Please check your camera, microphone, and screen sharing permissions.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start recording. Please check your permissions.",
      });
      console.error(err);
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && stream) {
      mediaRecorderRef.current.stop();
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setStream(null);

      toast({
        title: "Recording Stopped",
        description: "Your interview recording has been saved.",
      });
    }
  }, [stream, toast]);

  const uploadChunk = async (chunk: Blob) => {
    const formData = new FormData();
    formData.append("file", chunk, `chunk_${Date.now()}.webm`); // Keep the filename simple
    formData.append("fileId", fileIdRef.current!); // Append the fileId as a separate field in formData

    try {
      const response = await axios.post(BASE_URL + "/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Ensure the correct content type for file uploads
        },
        withCredentials: true, // Include credentials (cookies, auth headers) if needed
      });
      console.log("Chunk uploaded:", response.data);
    } catch (error) {
      console.error("Chunk upload failed:", error);
      // Retry logic can be added here
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRecording) {
        stopRecording();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, stream, stopRecording]);

  return {
    isRecording,
    stream,
    error,
    startRecording,
    stopRecording,
  };
};
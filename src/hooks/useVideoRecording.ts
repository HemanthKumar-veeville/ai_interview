import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const CHUNK_DURATION = 10000; // 10 seconds in milliseconds

export const useVideoRecording = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileIdRef = useRef<string | null>(null);
  const chunkCountRef = useRef<number>(0);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startRecording = useCallback(async (cameraStream: MediaStream) => {
    try {
      fileIdRef.current = uuidv4();
      chunkCountRef.current = 0;

      // Store the camera stream
      setCameraStream(cameraStream);

      // Request screen sharing
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Create an audio context to mix audio streams
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Add system audio from screen sharing
      if (displayStream.getAudioTracks().length > 0) {
        const systemSource = audioContext.createMediaStreamSource(displayStream);
        systemSource.connect(destination);
      }

      // Add microphone audio
      if (cameraStream.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(cameraStream);
        micSource.connect(destination);
      }

      // Combine all tracks: screen video and mixed audio
      const tracks = [
        ...displayStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(tracks);

      setStream(combinedStream);
      setScreenStream(displayStream);

      // Initialize MediaRecorder with combined stream
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          await uploadChunk(event.data, chunkCountRef.current);
          chunkCountRef.current++;
        }
      };

      mediaRecorderRef.current.start(CHUNK_DURATION);
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Your interview is now being recorded.",
      });
    } catch (err) {
      setError("Failed to start recording or screen sharing. Please check your permissions.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start recording or screen sharing. Please check your permissions.",
      });
      console.error(err);
      throw err;
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (stream || screenStream)) {
      mediaRecorderRef.current.stop();

      // Stop all tracks in both streams
      stream?.getTracks().forEach((track) => track.stop());
      screenStream?.getTracks().forEach((track) => track.stop());

      setIsRecording(false);
      setStream(null);
      setScreenStream(null);

      toast({
        title: "Recording Stopped",
        description: "Your interview recording has been saved.",
      });
    }
  }, [stream, screenStream, toast]);

  const uploadChunk = async (chunk: Blob, chunkNumber: number) => {
    const formData = new FormData();
    formData.append("file", chunk, `chunk_${fileIdRef.current}_${chunkNumber}.webm`);
    formData.append("fileId", fileIdRef.current!);
    formData.append("chunkNumber", chunkNumber.toString());
    formData.append("timestamp", Date.now().toString());

    try {
      const response = await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      console.log(`Chunk ${chunkNumber} uploaded successfully:`, response.data);
    } catch (error) {
      console.error(`Chunk ${chunkNumber} upload failed:`, error);
      await retryUpload(chunk, chunkNumber);
    }
  };

  const retryUpload = async (chunk: Blob, chunkNumber: number, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay * i));
        await uploadChunk(chunk, chunkNumber);
        return;
      } catch (err) {
        console.error(`Retry ${i + 1} failed for chunk ${chunkNumber}:`, err);
        if (i === retries - 1) {
          toast({
            variant: "destructive",
            title: "Upload Error",
            description: `Failed to upload chunk ${chunkNumber}. Please check your connection.`,
          });
        }
      }
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording) {
        e.preventDefault();
        e.returnValue = "Recording is still in progress. Are you sure you want to leave?";
        stopRecording();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, stream, screenStream, stopRecording]);

  return {
    isRecording,
    stream,
    screenStream,
    cameraStream,
    error,
    startRecording,
    stopRecording,
  };
};
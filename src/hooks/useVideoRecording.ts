import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = "http://localhost:3000";

export const useVideoRecording = () => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileIdRef = useRef<string | null>(null);
  const previousChunkBlob = useRef<Blob | null>(null);

  const startRecording = useCallback(async () => {
    try {
      fileIdRef.current = uuidv4();

      // Capture camera and audio
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Capture screen with audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: 30,
        },
        audio: true,
      });

      // Create a new MediaStream for combined tracks
      const combinedStream = new MediaStream();

      // Add screen video track with constraints
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      combinedStream.addTrack(screenVideoTrack);

      // Add camera video track
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];
      combinedStream.addTrack(cameraVideoTrack);

      // Combine audio tracks using AudioContext
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Add microphone audio
      const microphoneSource = audioContext.createMediaStreamSource(cameraStream);
      microphoneSource.connect(destination);

      // Add system audio if available
      const systemAudioTracks = screenStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        const systemSource = audioContext.createMediaStreamSource(screenStream);
        systemSource.connect(destination);
      }

      // Add the combined audio track to the stream
      destination.stream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      setStream(combinedStream);

      // Initialize MediaRecorder with specific options for better chunk handling
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 3000000,
      });

      // Clear previous chunks
      chunksRef.current = [];
      previousChunkBlob.current = null;

      // Handle data available event with improved chunk processing
      mediaRecorderRef.current.ondataavailable = async (event: BlobEvent) => {
        if (event.data.size > 0) {
          try {
            // Create a self-contained chunk by including metadata
            const reader = new FileReader();
            reader.onload = async () => {
              const arrayBuffer = reader.result as ArrayBuffer;
              
              // Ensure chunk starts with a keyframe
              const chunk = new Blob([
                previousChunkBlob.current ? previousChunkBlob.current : new Blob(),
                new Blob([arrayBuffer])
              ], { type: "video/webm" });

              // Store current chunk for next iteration
              previousChunkBlob.current = chunk;
              
              // Store chunk locally
              chunksRef.current.push(chunk);
              
              // Upload chunk
              await uploadChunk(chunk);
            };
            
            reader.readAsArrayBuffer(event.data);
          } catch (err) {
            console.error("Error processing chunk:", err);
          }
        }
      };

      // Handle recording stop with improved final processing
      mediaRecorderRef.current.onstop = async () => {
        try {
          // Create final blob from all chunks
          const finalBlob = new Blob(chunksRef.current, { 
            type: "video/webm"
          });
          
          // Upload final complete video
          const formData = new FormData();
          formData.append("file", finalBlob, `complete_${fileIdRef.current}.webm`);
          formData.append("fileId", fileIdRef.current!);
          formData.append("isFinal", "true");

          await axios.post(`${BASE_URL}/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          });

          // Clear chunks and previous blob
          chunksRef.current = [];
          previousChunkBlob.current = null;
        } catch (err) {
          console.error("Failed to upload complete video:", err);
          toast({
            variant: "destructive",
            title: "Upload Error",
            description: "Failed to upload the complete video.",
          });
        }
      };

      // Start recording with configured chunk interval
      // Using 5 seconds instead of 10 for better chunk management
      mediaRecorderRef.current.start(5000);
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Your interview is now being recorded.",
      });
    } catch (err) {
      setError("Failed to start recording. Please check your permissions.");
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
      
      // Stop all tracks in the stream
      stream.getTracks().forEach((track) => track.stop());
      
      setIsRecording(false);
      setStream(null);
      previousChunkBlob.current = null;

      toast({
        title: "Recording Stopped",
        description: "Your interview recording has been saved.",
      });
    }
  }, [stream, toast]);

  const uploadChunk = async (chunk: Blob) => {
    const formData = new FormData();
    const timestamp = Date.now();
    formData.append("file", chunk, `chunk_${timestamp}.webm`);
    formData.append("fileId", fileIdRef.current!);
    formData.append("timestamp", timestamp.toString());

    try {
      const response = await axios.post(`${BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      console.log("Chunk uploaded successfully:", response.data);
    } catch (error) {
      console.error("Chunk upload failed:", error);
      await retryUpload(chunk);
    }
  };

  const retryUpload = async (chunk: Blob, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay * i));
        await uploadChunk(chunk);
        return;
      } catch (err) {
        console.error(`Retry ${i + 1} failed:`, err);
        if (i === retries - 1) {
          toast({
            variant: "destructive",
            title: "Upload Error",
            description: "Failed to upload recording chunk. Please check your connection.",
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
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
}

export interface VideoRecordingState {
  isRecording: boolean;
  stream: MediaStream | null;
  error: string | null;
  mediaRecorder: MediaRecorder | null;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
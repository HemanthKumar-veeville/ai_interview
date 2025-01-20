import { useState, useEffect, useRef } from "react";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Check } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/api-client";
import { v4 as uuidv4 } from "uuid";

interface ChatProps {
  onInterviewEnd: () => void;
}

// Enhanced interview questions with proper validation and UI options
const INTERVIEW_QUESTIONS = [
  {
    id: "welcome",
    content:
      "🌟 Welcome to the Tesco Talent Gateway! 🌟\n\nHello! We're thrilled you're considering joining the Tesco family, where innovation and passion drive everything we do. Let's get started with a few quick questions to ensure the best match for you. 💼\n\nFirst things first, what's your name? 😊",
    type: "text",
    validation: (answer: string) => {
      const name = answer.trim();
      return name.length > 0
        ? { valid: true, value: name }
        : { valid: false, message: "Please provide your name to continue." };
    },
  },
  {
    id: "role",
    content: (name: string) =>
      `Wonderful to meet you, ${name}! 😊 Your journey with Tesco could be just around the corner!\n\nTell me, ${name}, which of these exciting roles interests you the most?`,
    type: "choice",
    options: [
      { id: "sde2", label: "Software Development Engineer (SDE2) 👨‍💻" },
      { id: "pm", label: "Product Manager 📊" },
      { id: "others", label: "Others 🌀" },
    ],
    validation: (answer: string) => {
      return answer === "others"
        ? {
            valid: false,
            message: (name: string) =>
              `Thank you for your enthusiasm, ${name}! 🌟 While we're currently focusing on specific roles, we'd love to keep you in our Tesco talent community for future opportunities.\n\n📧 Please send your resume to joinus@tesco.com, and we'll make sure to reach out when the perfect role opens up!`,
          }
        : { valid: true, value: answer };
    },
  },
  {
    id: "break",
    content: (name: string) =>
      `Thanks for sharing that, ${name}! 😊\n\nWe believe that career breaks can bring valuable perspectives. Have you had a career break in the past? Please select the duration: 🌱`,
    type: "choice",
    options: [
      {
        id: "sixplus",
        label: "Greater than or equal to 6 months ✨",
      },
      {
        id: "lesssix",
        label: "Less than 6 months ⏳",
      },
    ],
    validation: (answer: string) => {
      return answer === "lesssix"
        ? {
            valid: false,
            message: (name: string) =>
              `We really appreciate your openness, ${name}! 🌟 At Tesco, we're specifically looking for candidates who've had a career break of over 6 months. Please stay connected with us at joinus@tesco.com for future opportunities that might be a perfect match! 💫`,
          }
        : { valid: true, value: "6+ months" };
    },
  },
  {
    id: "experience",
    content: (name: string) =>
      `You're doing great, ${name}! 🌟\n\nI'd love to hear about your professional journey. Please select your years of experience: 💼`,
    type: "choice",
    options: [
      {
        id: "fiveplus",
        label: "Greater than or equal to 5 years 🚀",
      },
      {
        id: "lessfive",
        label: "Less than 5 years ⌛",
      },
    ],
    validation: (answer: string) => {
      return answer === "lessfive"
        ? {
            valid: false,
            message: (name: string) =>
              `Thank you for sharing your journey with us, ${name}! 🌟 While we're currently seeking candidates with over 5 years of experience, we'd love to keep in touch! Please send your resume to joinus@tesco.com, and we'll reach out when the perfect opportunity arises. Keep growing! 🚀`,
          }
        : { valid: true, value: "5+ years" };
    },
  },
  {
    id: "resume",
    content: (name: string) =>
      `Excellent, ${name}! You've got an impressive background! 🌟\n\nNow, let's take the next step together. Could you please share your latest Resume? 📄`,
    type: "upload",
    validation: (files: FileList) => {
      return files.length > 0
        ? { valid: true, value: Array.from(files) }
        : {
            valid: false,
            message: (name: string) =>
              `${name}, please provide your resume to proceed.`,
          };
    },
  },
  {
    id: "coverletter",
    content: (name: string) =>
      `Thank you for sharing your resume, ${name}! 📄\n\nWould you like to include a Cover Letter with your application? ✉️\nWhile optional, a personalized cover letter can help us better understand your motivation!`,
    type: "choice",
    options: [
      {
        id: "yes",
        label: "Yes, I'll upload a cover letter ✉️",
      },
      {
        id: "no",
        label: "No, proceed without cover letter ➡️",
      },
    ],
    validation: (answer: string) => {
      if (answer === "yes") {
        return {
          valid: true,
          value: "pending_upload",
          requiresUpload: true,
        };
      }
      return {
        valid: true,
        value: null,
      };
    },
  },
  {
    id: "final",
    content: (name: string) =>
      `Thank you so much for your time today, ${name}! 🌟\n\nYou've shared some really impressive insights with us. Our team will carefully review your profile, and if you're shortlisted, we'll be in touch soon. We're excited about the possibility of having you join our Tesco family! ✨\n\nHave a wonderful day ahead! 😊`,
    type: "end",
  },
];

// Add this interface for the API payload
interface ApplicantPayload {
  instanceId: string;
  name: string;
  role: string;
  careerGap: string;
  experience: string;
  resumeLink?: string;
  coverLetterLink?: string;
  conversations: Message[];
}

// Add this interface near the top of the file
interface InterviewAnswers {
  role?: "sde2" | "pm" | "others";
  break?: "sixplus" | "lesssix";
  experience?: "fiveplus" | "lessfive";
  resume?: FileList;
  coverletter?: FileList;
  resumeLink?: string;
  coverLetterLink?: string;
  careerGap?: string;
  experienceYears?: string;
}

// Add this interface for the document upload response
interface DocumentUploadResponse {
  success: boolean;
  data: {
    url: string;
    key: string;
    documentType: string;
  };
}

const QuestionContent = ({
  question,
  userName,
  onAnswer,
  showChoices,
  isValidationFailed,
  isCoverLetterUpload,
}: {
  question: (typeof INTERVIEW_QUESTIONS)[number];
  userName: string;
  onAnswer: (answer: string | FileList) => void;
  showChoices: boolean;
  isValidationFailed: boolean;
  isCoverLetterUpload: boolean;
}) => {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset selected option when question changes
  useEffect(() => {
    setSelectedOption("");
  }, [question.id]);

  // Don't show choices if validation failed or not meant to show
  if (!showChoices || isValidationFailed) return null;

  // Show upload button for cover letter if in upload mode
  if (isCoverLetterUpload && question.id === "coverletter") {
    return (
      <div className="mt-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => e.target.files && onAnswer(e.target.files)}
          accept=".pdf,.doc,.docx"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          Upload Cover Letter
        </Button>
      </div>
    );
  }

  switch (question.type) {
    case "text":
      // For name input, we'll use speech recognition only
      return null;

    case "choice":
      return (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <RadioGroup
              value={selectedOption}
              onValueChange={(value) => {
                setSelectedOption(value);
                setTimeout(() => onAnswer(value), 300);
              }}
            >
              {question.options?.map((option) => (
                <div
                  key={option.id}
                  className={`
                    flex items-center space-x-2 p-3 rounded-lg transition-colors cursor-pointer
                    ${
                      selectedOption === option.id
                        ? "bg-primary/10 dark:bg-primary/20"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className={`flex-1 cursor-pointer ${
                      selectedOption === option.id
                        ? "font-medium text-primary dark:text-primary"
                        : ""
                    }`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      );

    case "upload":
      return (
        <div className="mt-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => e.target.files && onAnswer(e.target.files)}
            accept=".pdf,.doc,.docx"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            {question.id === "resume" ? "Upload Resume" : "Upload Cover Letter"}
          </Button>
        </div>
      );

    default:
      return null;
  }
};

export const Chat = ({ onInterviewEnd }: ChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [countdown, setCountdown] = useState(6);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoFeeds, setVideoFeeds] = useState<boolean>(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [showChoices, setShowChoices] = useState(false);
  const [isValidationFailed, setIsValidationFailed] = useState(false);
  const [isCoverLetterUpload, setIsCoverLetterUpload] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [instanceId] = useState(() => uuidv4());

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecognitionActive = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean exit mechanism
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isRecognitionActive.current && recognitionRef.current) {
        recognitionRef.current.stop();
        isRecognitionActive.current = false;
        setIsListening(false);
      }

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }

      setMessages([]);
      setLiveTranscript("");
      setInterimTranscript("");
      setIsLoading(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Countdown timer for interview start
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          clearInterval(timer);
          initiateConversation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Error",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscript = transcript;
          break;
        } else {
          interimTranscript = transcript;
        }
      }

      if (finalTranscript) {
        setLiveTranscript(finalTranscript);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
          if (!isSpeakingRef.current) {
            handleAnswer(finalTranscript);
          }
        }, 1500);
      }
      setInterimTranscript(interimTranscript);
    };

    recognitionRef.current.onerror = () => {
      repeatLastQuestion();
    };

    recognitionRef.current.onend = () => {
      if (isRecognitionActive.current) {
        restartRecognition();
      }
    };

    startRecognition();

    return () => {
      stopRecognition();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
    };
  }, []);

  // Modify the existing useEffect for scroll behavior
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        // Use requestAnimationFrame to ensure DOM updates are complete
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        });
      }
    };

    // Scroll on messages change
    scrollToBottom();

    // Scroll when choices are shown
    if (showChoices) {
      scrollToBottom();
    }

    // Scroll when interim transcript changes
    if (interimTranscript) {
      scrollToBottom();
    }
  }, [messages, showChoices, interimTranscript]);

  // Add this useEffect to handle scroll when currentQuestionIndex changes
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }
  }, [currentQuestionIndex]);

  // Voice synthesis setup
  useEffect(() => {
    let voicesLoaded = false;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded = true;
        console.log(
          "Loaded voices:",
          voices.map((v) => `${v.name} (${v.lang})`)
        );
      }
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const voiceLoadInterval = setInterval(() => {
      if (!voicesLoaded) {
        loadVoices();
      } else {
        clearInterval(voiceLoadInterval);
      }
    }, 100);

    setTimeout(() => clearInterval(voiceLoadInterval), 3000);

    return () => {
      clearInterval(voiceLoadInterval);
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Speech synthesis cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current = null;
      }
    };
  }, []);

  const startRecognition = () => {
    if (
      !isRecognitionActive.current &&
      recognitionRef.current &&
      !isSpeakingRef.current
    ) {
      recognitionRef.current.start();
      isRecognitionActive.current = true;
      setIsListening(true);
    }
  };

  const stopRecognition = () => {
    if (isRecognitionActive.current && recognitionRef.current) {
      recognitionRef.current.stop();
      isRecognitionActive.current = false;
      setIsListening(false);
    }
  };

  const restartRecognition = () => {
    stopRecognition();
    setTimeout(() => startRecognition(), 500);
  };

  const initiateConversation = () => {
    const initialMessage: Message = {
      id: "1",
      content: INTERVIEW_QUESTIONS[0].content,
      role: "assistant",
      timestamp: Date.now(),
    };
    setMessages([initialMessage]);
    speak(initialMessage.content);
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      stopRecognition();
      setShowChoices(false);

      if (currentUtteranceRef.current) {
        currentUtteranceRef.current = null;
      }

      // Remove emojis from text before speaking
      const textWithoutEmojis = text
        .replace(
          /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
          ""
        )
        .trim();

      const utterance = new SpeechSynthesisUtterance(textWithoutEmojis);

      // Get all available voices
      const voices = window.speechSynthesis.getVoices();

      // Try to find a female British/Indian English voice
      const preferredVoice =
        voices.find(
          (voice) =>
            (voice.name.includes("Female") || !voice.name.includes("Male")) &&
            (voice.name.includes("British") ||
              voice.name.includes("Indian") ||
              voice.name.includes("UK") ||
              voice.lang === "en-GB")
        ) ||
        voices.find(
          // Fallback to any female English voice
          (voice) =>
            (voice.name.includes("Female") || !voice.name.includes("Male")) &&
            voice.lang.startsWith("en")
        );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Set speech properties for clarity
      utterance.rate = 0.9; // Slightly slower speed
      utterance.pitch = 1.1; // Slightly higher pitch for female voice
      utterance.volume = 1.0; // Full volume
      utterance.lang = "en-GB"; // British English

      currentUtteranceRef.current = utterance;

      const keepAlive = () => {
        if (isSpeakingRef.current) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
          setTimeout(keepAlive, 5000);
        }
      };

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        stopRecognition();
        keepAlive();
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
        setShowChoices(true);

        // Only start recognition for text-type questions
        const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex];
        if (currentQuestion?.type === "text" && currentQuestion.id !== "name") {
          setTimeout(() => {
            if (!isSpeakingRef.current) {
              startRecognition();
            }
          }, 1000);
        }
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Update the uploadDocument function
  const uploadDocument = async (file: File, type: "resume" | "coverletter") => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("instanceId", instanceId);
      formData.append("documentType", type);

      const response = await apiClient.post<DocumentUploadResponse>(
        "/documents/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Check for success and data.url in the response
      if (response.data?.success && response.data?.data?.url) {
        // Update answers with the file URL - using the correct key based on type
        const linkKey = type === "resume" ? "resumeLink" : "coverLetterLink";

        setAnswers((prev) => ({
          ...prev,
          [linkKey]: response.data.data.url,
        }));

        console.log(`Updated ${type} link:`, response.data.data.url); // Add logging
        return response.data.data.url;
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${type}. Please try again.`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Move the API call logic to a separate function
  const saveApplicantData = async () => {
    try {
      setIsSaving(true);

      // Prepare the API payload
      const applicantPayload: ApplicantPayload = {
        instanceId,
        name: userName.trim(),
        role:
          answers.role === "sde2"
            ? "Software Development Engineer (SDE2)"
            : answers.role === "pm"
            ? "Product Manager"
            : "",
        careerGap: answers.careerGap || "notspecified",
        experience: answers.experience || "notspecified",
        resumeLink: answers.resumeLink || "",
        coverLetterLink: answers.coverLetterLink || "",
        conversations: messages,
      };

      console.log("Final payload:", applicantPayload);

      // Make the API call
      const response = await apiClient.post("/applicants", applicantPayload);

      if (!response.data) {
        throw new Error("Failed to save applicant data");
      }
    } catch (error) {
      console.error("Error saving applicant data:", error);
      toast({
        title: "Error",
        description: "Failed to save your application. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Update the handleAnswer function
  const handleAnswer = async (answer: string | FileList) => {
    if (!answer || isSpeakingRef.current || isLoading) return;

    setIsLoading(true);
    stopRecognition();
    setShowChoices(false);
    setIsValidationFailed(false);

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (noSpeechTimeoutRef.current) clearTimeout(noSpeechTimeoutRef.current);

    try {
      const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex];

      // Handle file uploads for resume and cover letter
      if (answer instanceof FileList && answer.length > 0) {
        const file = answer[0];
        const type = currentQuestion.id === "resume" ? "resume" : "coverletter";

        // Upload the document and wait for the URL
        await uploadDocument(file, type);

        // Create message with upload confirmation
        const userMessage: Message = {
          id: Date.now().toString(),
          content: `Uploaded ${file.name} successfully`,
          role: "user",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setLiveTranscript("");
        setInterimTranscript("");

        // If this was the cover letter upload, save applicant data before moving to final message
        if (type === "coverletter") {
          await saveApplicantData();
        }

        // Move to next question after successful upload
        if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
          const nextQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex + 1];
          const nextContent =
            typeof nextQuestion.content === "function"
              ? nextQuestion.content(userName)
              : nextQuestion.content;

          const nextMessage: Message = {
            id: Date.now().toString(),
            content: nextContent,
            role: "assistant",
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, nextMessage]);
          setCurrentQuestionIndex((prev) => prev + 1);
          await speak(nextContent);
        }
      } else {
        // Handle non-file answers
        const userMessage: Message = {
          id: Date.now().toString(),
          content: answer as string,
          role: "user",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setLiveTranscript("");
        setInterimTranscript("");

        // Update state based on question type
        switch (currentQuestion.id) {
          case "welcome":
            // Store name
            setUserName(answer as string);
            setAnswers((prev) => ({
              ...prev,
              name: answer as string,
            }));
            break;

          case "role":
            // Store role
            setAnswers((prev) => ({
              ...prev,
              role: answer as string,
            }));
            break;

          case "break":
            // Store career gap
            setAnswers((prev) => ({
              ...prev,
              careerGap: answer === "sixplus" ? "6+months" : "lessthan6months",
            }));
            break;

          case "experience":
            // Store experience
            setAnswers((prev) => ({
              ...prev,
              experience: answer === "fiveplus" ? "5+years" : "lessthan5years",
            }));
            break;

          case "coverletter":
            if (answer === "yes") {
              // Show upload UI
              setIsCoverLetterUpload(true);
              const uploadPrompt: Message = {
                id: Date.now().toString(),
                content: "Please upload your cover letter.",
                role: "assistant",
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, uploadPrompt]);
              await speak(uploadPrompt.content);
              setShowChoices(true);
              return;
            } else {
              // If user selected "no", save applicant data before moving to final message
              setAnswers((prev) => ({
                ...prev,
                coverLetterLink: "",
              }));
              await saveApplicantData();
            }
            break;
        }

        // Handle validation and next question
        const validationResult = currentQuestion.validation?.(answer as string);

        if (!validationResult?.valid) {
          setIsValidationFailed(true);
          const rejectionMessage =
            typeof validationResult?.message === "function"
              ? validationResult.message(userName)
              : validationResult?.message;

          const rejectionMsgObj: Message = {
            id: Date.now().toString(),
            content: rejectionMessage,
            role: "assistant",
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, rejectionMsgObj]);
          await speak(rejectionMessage);
          return;
        }

        // Move to next question if validation passed
        if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
          const nextQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex + 1];
          const nextContent =
            typeof nextQuestion.content === "function"
              ? nextQuestion.content(userName)
              : nextQuestion.content;

          const nextMessage: Message = {
            id: Date.now().toString(),
            content: nextContent,
            role: "assistant",
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, nextMessage]);
          setCurrentQuestionIndex((prev) => prev + 1);
          await speak(nextContent);
        }
      }
    } catch (error) {
      // Only show error toast if it's not a file upload error
      if (!(error instanceof Error && error.message.includes("upload"))) {
        console.error("Error processing answer:", error);
        toast({
          title: "Error",
          description: "There was an error processing your response.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const repeatLastQuestion = () => {
    if (
      !isSpeakingRef.current &&
      messages.length > 0 &&
      messages[messages.length - 1]?.role === "assistant"
    ) {
      const lastMessage = messages[messages.length - 1];
      const repeatedContent = `I didn't catch that. Let me repeat: ${lastMessage.content}`;

      speak(repeatedContent);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: repeatedContent,
          role: "assistant",
          timestamp: Date.now(),
        },
      ]);
    }
  };

  // Update handleEndInterview to remove the API call
  const handleEndInterview = async () => {
    try {
      setIsSaving(true);

      // Clear all states
      clearAllStates();

      // Continue with the existing end interview logic
      setVideoFeeds(false);
      onInterviewEnd();
      window.dispatchEvent(new CustomEvent("endInterview"));
      window.speechSynthesis.cancel();
      stopRecognition();

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      // Stop any existing media tracks
      const existingTracks = await navigator.mediaDevices
        .getUserMedia({ audio: false, video: false })
        .catch(() => null);

      if (existingTracks) {
        existingTracks.getTracks().forEach((track) => track.stop());
      }

      const closingMessage: Message = {
        id: Date.now().toString(),
        content: `Thank you for participating in this interview, ${userName}. The session has ended.`,
        role: "assistant",
        timestamp: Date.now(),
      };

      const speakClosing = new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(closingMessage.content);
        utterance.onend = () => {
          window.speechSynthesis.cancel();
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });

      setMessages((prev) => [...prev, closingMessage]);
      await speakClosing;

      setLiveTranscript("");
      setInterimTranscript("");
      setIsListening(false);
      setIsLoading(false);

      toast({
        title: "Interview Ended",
        description:
          "All recordings have been stopped and your session has ended.",
        duration: 3000,
      });

      setIsInterviewEnded(true);
    } catch (error) {
      console.error("Error ending interview:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "There was an error ending the interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add a function to clear all states
  const clearAllStates = () => {
    setMessages([]);
    setIsLoading(false);
    setIsListening(false);
    setLiveTranscript("");
    setInterimTranscript("");
    setCountdown(6);
    setIsTimerRunning(false);
    setIsInterviewEnded(false);
    setStream(null);
    setVideoFeeds(false);
    setCurrentQuestionIndex(0);
    setUserName("");
    setAnswers({});
    setShowChoices(false);
    setIsValidationFailed(false);
    setIsCoverLetterUpload(false);
    setIsSaving(false);

    // Clear all timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
      noSpeechTimeoutRef.current = null;
    }

    // Reset all refs
    recognitionRef.current = null;
    isRecognitionActive.current = false;
    isSpeakingRef.current = false;
    currentUtteranceRef.current = null;
  };

  // Add a cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      clearAllStates();
    };
  }, []);

  return (
    <div
      className={`flex flex-col ${
        isInterviewEnded ? "min-h-[600px]" : "h-[85vh]"
      } bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden`}
    >
      {isInterviewEnded ? (
        <div className="flex flex-col items-center justify-center h-full space-y-8 p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Check className="w-14 h-14 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-lg mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Interview Completed
            </h2>
            <div className="space-y-4">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Thank you for participating in the interview. Your session has
                been successfully completed.
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Session Status:
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Camera and microphone access terminated
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Screen recording stopped
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    All audio instances cleared
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                You may now safely close this tab.
              </p>
            </div>
          </motion.div>
        </div>
      ) : isTimerRunning ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-2xl font-semibold">
            Interview starts in: {countdown}s
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 max-w-3xl mx-auto">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-12"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-12"
                      }`}
                    >
                      <div className="break-words">{message.content}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(message.timestamp, "HH:mm")}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(interimTranscript || liveTranscript) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      <div className="break-words">
                        {liveTranscript || interimTranscript}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {interimTranscript ? "Listening..." : "Processing..."}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Current question UI */}
                {INTERVIEW_QUESTIONS[currentQuestionIndex] && (
                  <QuestionContent
                    question={INTERVIEW_QUESTIONS[currentQuestionIndex]}
                    userName={userName}
                    onAnswer={handleAnswer}
                    showChoices={showChoices}
                    isValidationFailed={isValidationFailed}
                    isCoverLetterUpload={isCoverLetterUpload}
                  />
                )}

                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>
          </ScrollArea>

          <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
              <div className="flex justify-center gap-4">
                <div className="flex flex-col items-center">
                  <Button
                    className={`p-4 rounded-full ${
                      isListening ? "bg-red-500" : "bg-primary"
                    } text-white`}
                    size="icon"
                    onClick={() =>
                      isListening ? stopRecognition() : startRecognition()
                    }
                  >
                    <Mic className="w-6 h-6" />
                  </Button>
                  <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {isListening
                      ? "Listening..."
                      : isSpeakingRef.current
                      ? "Speaking..."
                      : ""}
                  </span>
                </div>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleEndInterview}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "End Interview"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;

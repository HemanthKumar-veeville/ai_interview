import { useState, useEffect, useRef } from "react";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Check, MicOff, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/api-client";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

interface ChatProps {
  onInterviewEnd: () => void;
  instanceId: string;
  isScreenShared: boolean;
  setTaraState: (state: string) => void;
}

// Enhanced interview questions with proper validation and UI options
const INTERVIEW_QUESTIONS = [
  {
    id: "welcome",
    content:
      "🌟 Welcome, to the Tesco Talent Gateway! 🌟\n\nHello! I'm TARA (Tesco's AI Recruitment Assistant). Let's get started with a few quick questions to ensure the best match for you. 💼\n\nFirst things first, tell me your first name in 1 word",
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
      `Wonderful to meet you, ${name}! 😊 Your journey with Tesco could be just around the corner!\n\nPlease choose the role that interests you the most?`,
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
      `You're, doing great, ${name}! 🌟\n\nI'd love to hear about your professional journey. Please select your years of experience: 💼`,
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
    id: "coverletter",
    content: (name: string) =>
      `Excellent, ${name}! You've got an impressive background! 🌟\n\nWould you like to include a Cover Letter with your application? ✉\nWhile optional, a personalized cover letter can help us better understand your motivation!`,
    type: "choice",
    options: [
      {
        id: "yes",
        label: "Yes, I'll upload a cover letter ✉",
      },
      {
        id: "no",
        label: "No, proceed without cover letter ➡",
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
    id: "resume",
    content: (name: string) =>
      `Thank you for sharing your cover letter, ${name}! 📄\n\nNow, let's take the next step together. Could you please share your latest Resume? 📄`,
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
  documentAnalysis?: {
    resume?: DocumentAnalysis;
    coverletter?: DocumentAnalysis;
  };
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

// Add these interfaces near the top with other interfaces
interface DocumentAnalysis {
  success: boolean;
  data: {
    url: string;
    key: string;
    documentType: string;
    analysis: string;
    validation: string;
    recommendedQuestions: {
      technical: Array<{
        question: string;
        expectedAnswer: string;
      }>;
      behavioral: Array<{
        question: string;
        expectedAnswer: string;
      }>;
    };
  };
}

// Update the MicState enum
enum MicState {
  READY = "ready", // Blue mic - ready to start (muted)
  SPEAKING = "speaking", // Blue mic - assistant speaking (muted)
  LISTENING = "listening", // Red mic - actively listening (unmuted)
  PROCESSING = "processing", // Red mic - processing speech (muted)
}

// Add a new interface for Phase 2 questions
interface Phase2Question {
  question: string;
  expectedAnswer: string;
}

const QuestionContent = ({
  question,
  userName,
  onAnswer,
  showChoices,
  isValidationFailed,
  isCoverLetterUpload,
  isPhase2,
}: {
  question: (typeof INTERVIEW_QUESTIONS)[number] | Phase2Question;
  userName: string;
  onAnswer: (answer: string | FileList) => void;
  showChoices: boolean;
  isValidationFailed: boolean;
  isCoverLetterUpload: boolean;
  isPhase2: boolean;
}) => {
  // If it's Phase 2, don't show any UI controls
  if (isPhase2) return null;

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

// First, add a new component to display document analysis results
const DocumentAnalysisResults = ({
  analysis,
  onClose,
}: {
  analysis: DocumentAnalysis;
  onClose: () => void;
}) => {
  console.log({ analysis });
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Document Analysis Results</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[60vh] space-y-4">
            {/* Parse and display the analysis JSON */}
            {analysis.data.analysis && (
              <div className="space-y-6">
                {Object.entries(JSON.parse(analysis.data.analysis)).map(
                  ([key, value]) => (
                    <div key={key} className="space-y-2">
                      <h4 className="font-medium text-lg">{key}</h4>
                      {Array.isArray(value) ? (
                        <ul className="list-disc pl-5 space-y-2">
                          {value.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300">
                          {value as string}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Update the DocumentAnalysisStatus component with a professional loader
const DocumentAnalysisStatus = ({ isAnalyzing }: { isAnalyzing: boolean }) => {
  if (!isAnalyzing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg min-w-[300px]"
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="w-8 h-8 border-4 border-primary/30 rounded-full" />
                <div className="absolute top-0 left-0 w-8 h-8 border-4 border-primary rounded-full animate-spin border-t-transparent" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm">
              Document Analysis in Progress
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1 bg-primary/20 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-full w-1/3 bg-primary rounded-full"
                />
              </motion.div>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <AnimatePresence mode="wait">
            <motion.div
              key={Math.random()} // Force re-render for animation
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {
                [
                  "Extracting document content...",
                  "Analyzing professional experience...",
                  "Evaluating skills and qualifications...",
                  "Generating insights...",
                ][Math.floor((Date.now() / 2000) % 4)]
              }
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Update the mic button UI component
const MicButton = ({
  state,
  onClick,
  disabled,
}: {
  state: MicState;
  onClick: () => void;
  disabled: boolean;
}) => {
  const getButtonStyle = () => {
    switch (state) {
      case MicState.READY:
        return "bg-blue-600 shadow-md shadow-blue-500/20";
      case MicState.SPEAKING:
        return "bg-blue-600 shadow-md shadow-blue-500/20";
      case MicState.LISTENING:
        return "bg-red-500 shadow-md shadow-red-500/20 animate-pulse";
      case MicState.PROCESSING:
        return "bg-red-400 shadow-md shadow-red-400/20";
    }
  };

  const getIcon = () => {
    switch (state) {
      case MicState.READY:
        return <MicOff className="w-4 h-4" />;
      case MicState.SPEAKING:
        return <MicOff className="w-4 h-4" />;
      case MicState.LISTENING:
        return <Mic className="w-4 h-4" />;
      case MicState.PROCESSING:
        return <MicOff className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case MicState.READY:
        return "Click to speak";
      case MicState.SPEAKING:
        return "Speaking...";
      case MicState.LISTENING:
        return "Click to submit";
      case MicState.PROCESSING:
        return "Processing...";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`p-3 rounded-full transition-all duration-200 ${getButtonStyle()} text-white`}
        onClick={onClick}
        disabled={
          disabled ||
          state === MicState.SPEAKING ||
          state === MicState.PROCESSING
        }
      >
        {getIcon()}
      </motion.button>
      <span className="text-xs mt-1.5 text-gray-600 font-medium">
        {getStatusText()}
      </span>
    </div>
  );
};

// Update the DocumentAnalysisSummary component
const DocumentAnalysisSummary = ({
  analysis,
}: {
  analysis: any; // Using any since the structure can vary
}) => {
  console.log({ analysis });
  if (!analysis) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
    >
      {/* Candidate Summary Section */}
      {analysis?.candidateSummary && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-blue-100 rounded-lg">👤</span>
            Profile Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysis.candidateSummary).map(
              ([key, value]) =>
                value && (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-gray-700 font-medium mt-1">
                      {String(value)}
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Skills Assessment Section */}
      {analysis?.skillsAssessment && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-green-100 rounded-lg">💡</span>
            Skills & Expertise
          </h3>
          <div className="space-y-4">
            {/* Technical Skills */}
            {analysis.skillsAssessment.technicalSkills?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-md font-medium text-gray-700">
                  Technical Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.skillsAssessment.technicalSkills.map(
                    (skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Certifications */}
            {analysis.skillsAssessment.certifications?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-md font-medium text-gray-700">
                  Certifications
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.skillsAssessment.certifications.map(
                    (cert: string) => (
                      <li key={cert} className="text-gray-600">
                        {cert}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Experience Section */}
      {analysis?.experienceValidation?.roles?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-purple-100 rounded-lg">💼</span>
            Professional Experience
          </h3>
          <div className="space-y-6">
            {analysis.experienceValidation.roles.map(
              (role: any, index: number) => (
                <div
                  key={index}
                  className="relative pl-4 border-l-2 border-gray-200"
                >
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full" />
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-medium text-gray-800">
                        {role?.title}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {role?.duration}
                      </span>
                    </div>
                    <div className="text-gray-600">{role?.company}</div>
                    {role?.responsibilities?.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                        {role.responsibilities.map(
                          (resp: string, idx: number) => (
                            <li key={idx}>{resp}</li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Red Flags Section - Only show if there are concerns */}
      {analysis?.redFlags?.concerns?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-red-100 rounded-lg">⚠️</span>
            Areas of Attention
          </h3>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-700 font-medium">
              Risk Level: {analysis.redFlags.riskLevel}
            </div>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {analysis.redFlags.concerns.map(
                (concern: string, index: number) => (
                  <li key={index} className="text-red-600">
                    {concern}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Match Analysis Section */}
      {analysis?.matchAnalysis && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-yellow-100 rounded-lg">🎯</span>
            Role Match Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.matchAnalysis.roleCompatibility && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Role Compatibility</div>
                <div className="text-gray-700 font-medium mt-1">
                  {analysis.matchAnalysis.roleCompatibility}
                </div>
              </div>
            )}
            {analysis.matchAnalysis.strengthAreas?.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-700 font-medium">
                  Strengths
                </div>
                <ul className="list-disc list-inside mt-1">
                  {analysis.matchAnalysis.strengthAreas.map(
                    (strength: string, index: number) => (
                      <li key={index} className="text-green-600">
                        {strength}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {analysis?.timestamp && (
        <div className="text-xs text-gray-400 text-right">
          Analysis generated on: {formatDate(analysis.timestamp)}
        </div>
      )}
    </motion.div>
  );
};

// Add this component for the interview consent message
const InterviewConsentMessage = ({
  onAnswer,
}: {
  onAnswer: (consent: boolean) => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button
          onClick={() => onAnswer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Yes, let's proceed
        </Button>
        <Button onClick={() => onAnswer(false)} variant="outline">
          No, skip for now
        </Button>
      </div>
    </div>
  );
};

export const Chat = ({
  onInterviewEnd,
  instanceId,
  isScreenShared,
  setTaraState,
}: ChatProps) => {
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

  // Add these new state variables
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [documentUploadPromises, setDocumentUploadPromises] = useState<
    Promise<any>[]
  >([]);

  // Add new state for showing analysis results
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] =
    useState<DocumentAnalysis | null>(null);

  // Add state for mic status
  const [micState, setMicState] = useState<MicState>(MicState.READY);

  // Add this near your other state declarations
  const [closeCountdown, setCloseCountdown] = useState(5);

  // Add new state for Phase 2 flag
  const [isInterviewPhase2, setIsInterviewPhase2] = useState(false);

  // Add state for interview questions
  const [interviewQuestions, setInterviewQuestions] = useState<
    Array<{
      question: string;
      expectedAnswer: string;
    }>
  >([]);

  // Add new state for storing interview conversations
  const [interviewConversations, setInterviewConversations] = useState<
    Array<{
      question: string;
      answer: string;
    }>
  >([]);

  // Add new state for Phase 2
  const [phase2Questions, setPhase2Questions] = useState<Phase2Question[]>([]);
  const [phase2Index, setPhase2Index] = useState<number>(0);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecognitionActive = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // console.log({ messages, answers });

  // Update the useEffect for countdown and navigation
  useEffect(() => {
    if (isInterviewEnded && closeCountdown > 0) {
      const timer = setInterval(() => {
        setCloseCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (isInterviewEnded && closeCountdown === 0) {
      // Navigate to Tesco website instead of closing
      window.location.href = "https://www.tesco-careers.com/";
    }
  }, [isInterviewEnded, closeCountdown]);

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

  // Update the timer display condition
  useEffect(() => {
    // Only start timer if screen has been shared
    if (!isScreenShared) {
      return;
    }

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
  }, [isScreenShared]);

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
      }
      setInterimTranscript(interimTranscript);
    };

    recognitionRef.current.onerror = () => {
      setMicState(MicState.READY);
      repeatLastQuestion();
    };

    recognitionRef.current.onend = () => {
      if (isRecognitionActive.current) {
        restartRecognition();
      } else {
        setMicState(MicState.READY);
      }
    };

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

  useEffect(() => {
    setTaraState(micState);
  }, [micState]);

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
    if (!recognitionRef.current) {
      initializeSpeechRecognition();
    }

    if (recognitionRef.current && !isRecognitionActive.current) {
      try {
        recognitionRef.current.start();
        isRecognitionActive.current = true;
        setIsListening(true);
        setLiveTranscript("");
        setInterimTranscript("");
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current && isRecognitionActive.current) {
      try {
        recognitionRef.current.stop();
        isRecognitionActive.current = false;
        setIsListening(false);
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
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
      setMicState(MicState.SPEAKING);

      if (currentUtteranceRef.current) {
        currentUtteranceRef.current = null;
      }

      // Improve emoji removal while preserving text structure
      const textWithoutEmojis = text
        .replace(
          /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
          ""
        ) // Remove emojis
        .replace(/\s+/g, " ") // Normalize spaces
        .replace(/\n+/g, ". ") // Convert newlines to periods for better speech flow
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
          (voice) =>
            (voice.name.includes("Female") || !voice.name.includes("Male")) &&
            voice.lang.startsWith("en")
        );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Adjust speech properties for better clarity
      utterance.rate = 0.9; // Slightly slower speed
      utterance.pitch = 1.1; // Slightly higher pitch
      utterance.volume = 1.0;
      utterance.lang = "en-GB";

      currentUtteranceRef.current = utterance;

      // Implement keepAlive mechanism
      const keepAlive = () => {
        if (isSpeakingRef.current) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
          setTimeout(keepAlive, 5000);
        }
      };

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setMicState(MicState.SPEAKING);
        keepAlive(); // Start the keepAlive mechanism
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
        setMicState(MicState.READY);
        setShowChoices(true);
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
        setMicState(MicState.READY);
        console.error("Speech synthesis error");
      };

      // Speak the entire text as one utterance instead of chunking
      window.speechSynthesis.speak(utterance);
    }
  };

  // Modify the uploadDocument function to handle analysis completion
  const uploadDocument = async (file: File, type: "resume" | "coverletter") => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("instanceId", instanceId);
      formData.append("documentType", type);
      formData.append("role", answers.role);

      setIsAnalyzing(true);

      const uploadPromise = apiClient
        .post<DocumentAnalysis>("/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          if (response.data?.success && response.data?.data?.url) {
            setAnswers((prev) => ({
              ...prev,
              [type === "resume" ? "resumeLink" : "coverLetterLink"]:
                response.data.data.url,
              documentAnalysis: {
                ...prev.documentAnalysis,
                [type]: response.data,
              },
            }));

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "assistant",
                content: "I've analyzed your profile, and here's what I found:",
                timestamp: Date.now(),
              },
              {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: JSON.stringify(response.data),
                timestamp: Date.now(),
                isAnalysis: true,
              },
            ]);

            setIsAnalyzing(false);
            setTimeout(() => startPhase2Interview(response.data), 1000);
            return response.data.data.url;
          }
          throw new Error("Invalid response format from server");
        })
        .catch((error) => {
          console.error(`Error uploading ${type}:`, error);
          setIsAnalyzing(false);

          // Instead of showing toast, add an error message and prompt for retry
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: `I apologize, but there seems to be an issue with the ${type} upload. Could you please try uploading it again?`,
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, errorMessage]);
          speak(errorMessage.content);

          // Reset the current question to show upload controls again
          if (type === "resume") {
            const resumeQuestion = INTERVIEW_QUESTIONS.find(
              (q) => q.id === "resume"
            );
            if (resumeQuestion) {
              const questionContent =
                typeof resumeQuestion.content === "function"
                  ? resumeQuestion.content(userName)
                  : resumeQuestion.content;

              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: questionContent,
                  timestamp: Date.now(),
                },
              ]);
            }
          } else {
            setIsCoverLetterUpload(true);
          }
          setShowChoices(true);
          throw error;
        });

      // Set a temporary URL immediately to continue the flow
      setAnswers((prev) => ({
        ...prev,
        [type === "resume" ? "resumeLink" : "coverLetterLink"]: "pending",
      }));

      return "pending";
    } catch (error) {
      setIsAnalyzing(false);
      console.error(`Error initiating ${type} upload:`, error);

      // Add an error message and prompt for retry
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `I apologize, but there seems to be an issue with the ${type} upload. Could you please try uploading it again?`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      speak(errorMessage.content);

      // Reset the current question to show upload controls again
      if (type === "resume") {
        const resumeQuestion = INTERVIEW_QUESTIONS.find(
          (q) => q.id === "resume"
        );
        if (resumeQuestion) {
          const questionContent =
            typeof resumeQuestion.content === "function"
              ? resumeQuestion.content(userName)
              : resumeQuestion.content;

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: questionContent,
              timestamp: Date.now(),
            },
          ]);
        }
      } else {
        setIsCoverLetterUpload(true);
      }
      setShowChoices(true);
      return "pending";
    }
  };

  const saveApplicantData = async () => {
    try {
      setIsSaving(true);

      // Create the final applicant data object
      const applicantData: ApplicantData = {
        instanceId,
        name: userName,
        role: answers.role,
        careerGap: answers.careerGap,
        experienceYears: answers.experience,
        resumeLink: answers.resumeLink,
        coverLetterLink: answers.coverLetterLink,
        timestamp: Date.now(),
        // documentAnalysis: answers.documentAnalysis,
      };

      // Make API call to save data
      const response = await axios.post(
        `${BASE_URL}/applicants`,
        applicantData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          body: applicantData,
        }
      );
      console.log("response", response);
      if (!response.data.success) {
        throw new Error("Failed to save applicant data");
      }

      toast({
        title: "Success",
        description: "Your application has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving applicant data:", error);
      toast({
        title: "Warning",
        description:
          "There was an issue saving your application, but you can continue.",
        variant: "destructive",
      });
      throw error; // Re-throw to handle in the calling function
    } finally {
      setIsSaving(false);
    }
  };

  // Update the handleAnswer function
  const handleAnswer = async (answer: string | FileList) => {
    if (isInterviewPhase2) {
      if (!answer || isSpeakingRef.current || isLoading) return;

      setIsLoading(true);
      stopRecognition();
      setMicState(MicState.READY);

      const currentQuestion = phase2Questions[phase2Index];

      // Store conversation
      setInterviewConversations((prev) => [
        ...prev,
        {
          question: currentQuestion.question,
          answer: answer as string,
        },
      ]);

      // Add user's answer
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: answer as string,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLiveTranscript("");
      setInterimTranscript("");

      // Move to next question
      const nextIndex = phase2Index + 1;
      if (nextIndex < phase2Questions.length) {
        const nextQuestion = phase2Questions[nextIndex];
        const questionMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: nextQuestion.question,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, questionMessage]);
        speak(questionMessage.content);
        setPhase2Index(nextIndex);
      } else {
        // Interview completed
        const completionMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Thank you for completing the interview. We'll review your responses and get back to you soon.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, completionMessage]);
        speak(completionMessage.content);
        setTimeout(() => handleEndInterview(), 5000);
      }

      setIsLoading(false);
      return;
    }

    if (!answer || isSpeakingRef.current || isLoading) return;

    setIsLoading(true);
    stopRecognition();
    setShowChoices(false);
    setIsValidationFailed(false);
    setMicState(MicState.READY); // Reset mic state after processing

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (noSpeechTimeoutRef.current) clearTimeout(noSpeechTimeoutRef.current);

    try {
      const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex];

      // Handle file uploads for resume and cover letter
      if (answer instanceof FileList && answer.length > 0) {
        const file = answer[0];
        const type = currentQuestion.id === "resume" ? "resume" : "coverletter";

        // Initiate upload without waiting
        type === "resume" && uploadDocument(file, type);

        // Create message with upload initiation
        const userMessage: Message = {
          id: Date.now().toString(),
          content: `Uploading ${file.name}...`,
          role: "user",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setLiveTranscript("");
        setInterimTranscript("");

        // Move to next question immediately
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
              await saveApplicantData();
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
      console.error("Error processing answer:", error);
      toast({
        title: "Error",
        description: "There was an error processing your response.",
        variant: "destructive",
      });
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

      // Stop speech synthesis and recognition first
      window.speechSynthesis.cancel();
      stopRecognition();

      // Stop all media tracks (audio and video)
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
      }

      // Check document analysis before ending
      // await checkDocumentAnalysis();

      // Clear all local states and resources
      clearAllStates();

      // Notify parent to handle media cleanup
      onInterviewEnd();

      // Update window state (keep this after onInterviewEnd)
      window.isInterviewEnded = true;
      window.dispatchEvent(new Event("resize"));

      const closingMessage: Message = {
        id: Date.now().toString(),
        content: `Thank you for participating in this interview, ${userName}. The session has ended.`,
        role: "assistant",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, closingMessage]);

      toast({
        title: "Interview Ended",
        description: "Your session has been successfully completed.",
        duration: 3000,
      });

      setIsInterviewEnded(true);
    } catch (error) {
      console.error("Error ending interview:", error);
      toast({
        title: "Error",
        description:
          "There was an error ending the interview. Please try again.",
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

  const checkDocumentAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      await Promise.race([
        Promise.all(documentUploadPromises),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Document analysis timeout")),
            10000
          )
        ),
      ]);

      if (answers.documentAnalysis?.resume) {
        // Start Phase 2 with the resume analysis
        startPhase2Interview(answers.documentAnalysis.resume);
      }
    } catch (error) {
      console.error("Document analysis incomplete:", error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update the handleMicClick function
  const handleMicClick = () => {
    if (isLoading) return;

    switch (micState) {
      case MicState.READY:
        if (!isSpeakingRef.current) {
          startRecognition();
          setMicState(MicState.LISTENING);
        }
        break;
      case MicState.LISTENING:
        stopRecognition();
        setMicState(MicState.PROCESSING);
        if (liveTranscript) {
          handleAnswer(liveTranscript);
        }
        break;
      case MicState.PROCESSING:
        // Do nothing while processing
        break;
      default:
        break;
    }
  };

  // Update the handleInterviewConsent function
  const handleInterviewConsent = (consent: boolean) => {
    if (consent) {
      // Start Phase 2 with first question
      const firstQuestion = phase2Questions[0];
      const questionMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: firstQuestion.question,
        timestamp: Date.now(),
      };
      setMessages([questionMessage]);
      speak(questionMessage.content);
    } else {
      const conclusionMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Thank you for your time. We appreciate your interest in Tesco.`,
        timestamp: Date.now(),
      };
      setMessages([conclusionMessage]);
      speak(conclusionMessage.content);
      setTimeout(() => handleEndInterview(), 5000);
    }
  };

  // Update the startPhase2Interview function
  const startPhase2Interview = (analysis: DocumentAnalysis) => {
    setIsInterviewPhase2(true);
    resetChatAndStartPhase2(analysis);
  };

  // Update the resetChatAndStartPhase2 function
  const resetChatAndStartPhase2 = (analysis: DocumentAnalysis) => {
    // Clear all Phase 1 states
    setMessages([]);
    setShowChoices(false);
    setIsValidationFailed(false);
    setIsCoverLetterUpload(false);
    setLiveTranscript("");
    setInterimTranscript("");
    setCurrentQuestionIndex(0);
    setInterviewConversations([]);

    // Set Phase 2 questions
    const technicalQuestions = analysis.data.recommendedQuestions.technical;
    const behavioralQuestions = analysis.data.recommendedQuestions.behavioral;
    setPhase2Questions([...technicalQuestions, ...behavioralQuestions]);
    setPhase2Index(0);
    setIsInterviewPhase2(true);

    // Add the analysis summary and consent messages
    const summaryMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: analysis,
      timestamp: Date.now(),
      isAnalysis: true,
    };

    const consentRequestMessage: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: `Based on your profile analysis, I would like to proceed with a technical and behavioral interview to better understand your experience. Would you like to continue?`,
      timestamp: Date.now(),
    };

    const consentMessage: Message = {
      id: Date.now() + 2,
      role: "assistant",
      content: "interview_consent",
      timestamp: Date.now(),
      isConsentRequest: true,
    };

    setMessages([summaryMessage, consentRequestMessage, consentMessage]);
    speak(consentRequestMessage.content);
  };

  return (
    <div
      className={`flex flex-col ${
        isInterviewEnded ? "h-[65vh]" : "h-[85vh]"
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
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                <motion.div
                  key={closeCountdown}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-medium"
                >
                  This window will close in {closeCountdown} second
                  {closeCountdown !== 1 ? "s" : ""}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : !isScreenShared ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="text-2xl font-semibold text-gray-700">
              Please share your screen to begin
            </div>
            <p className="text-gray-500">
              The interview will start after screen sharing is enabled
            </p>
          </div>
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
                      className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${
                        message.role === "user"
                          ? "bg-blue-600 text-white ml-12"
                          : "bg-white/95 backdrop-blur-sm text-gray-800 mr-12 border border-white/20"
                      }`}
                    >
                      {message.isAnalysis ? (
                        <DocumentAnalysisSummary
                          analysis={message?.content?.data?.analysis || {}}
                        />
                      ) : message.isConsentRequest ? (
                        <InterviewConsentMessage
                          onAnswer={handleInterviewConsent}
                        />
                      ) : (
                        <>
                          <div className="break-words leading-relaxed">
                            {message.content}
                          </div>
                          <div
                            className={`text-xs mt-1 ${
                              message.role === "user"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {format(message.timestamp, "HH:mm")}
                          </div>
                        </>
                      )}
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
                    isPhase2={false}
                  />
                )}

                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-gray-200/20 bg-white/80 backdrop-blur-md">
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
              <div className="flex justify-center items-center gap-4">
                {!interimTranscript && (
                  <MicButton
                    state={micState}
                    onClick={handleMicClick}
                    disabled={isSaving}
                  />
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg shadow-md shadow-red-500/20 transition-all duration-200 disabled:opacity-50"
                  onClick={handleEndInterview}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "End Interview"
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Show analysis status during processing */}
          <DocumentAnalysisStatus isAnalyzing={isAnalyzing} />

          {/* Show analysis results when available */}
          <AnimatePresence>
            {showAnalysisResults && currentAnalysis && (
              <DocumentAnalysisResults
                analysis={currentAnalysis}
                onClose={() => {
                  setShowAnalysisResults(false);
                  setCurrentAnalysis(null);
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default Chat;

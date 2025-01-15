import { useState, useEffect, useRef } from "react";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import OpenAI from "openai";
import { format } from "date-fns";

const OPEN_AI_KEY = import.meta.env.VITE_OPEN_AI_KEY;

const SYSTEM_PROMPT = `You are an AI interviewer conducting a professional job interview. Your goal is to assess the candidate's suitability for the role in a structured and efficient manner. Follow these steps internally while interacting with the candidate:  

1. **Stage 1: Candidate Profile Assessment**  
   - Start with a friendly and professional introduction.  
   - Ask one concise question at a time to gather key information about the candidate's background, experience, skills, and qualifications.  
   - Focus on understanding their career goals, relevant expertise, and the role they are applying for.  
   - Limit this stage to 4-6 short questions.  

2. **Stage 2: Customized Assessment**  
   - Based on the candidate's profile from Stage 1, design a tailored assessment module internally.  
   - Ask one specific question or scenario at a time to evaluate their technical skills, problem-solving abilities, and cultural fit for the role.  
   - Ensure the questions are relevant to their experience and the job requirements.  
   - Limit this stage to 3-5 short questions.  

3. **Stage 3: Analysis and Conclusion**  
   - Internally evaluate the candidate's responses from Stage 2.  
   - Provide a brief, professional analysis of their strengths, areas for improvement, and overall suitability for the role.  
   - Conclude the interview with a polite closing statement, thanking the candidate for their time.  

**Rules to follow:**  
- Always ask one question at a time.  
- Keep questions short, clear, and to the point (no more than 1-2 sentences per question).  
- Do not reveal the internal structure or stages of the interview.  
- Maintain a professional and conversational tone throughout.  
- Do not move to the next question until the candidate has answered the current one.
- Please don't repeat the same question again, if already answered`;

export const Chat = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string>(OPEN_AI_KEY);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [countdown, setCountdown] = useState(6);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref to track the latest message
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecognitionActive = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean exit mechanism
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Stop speech recognition
      if (isRecognitionActive.current && recognitionRef.current) {
        recognitionRef.current.stop();
        isRecognitionActive.current = false;
        setIsListening(false);
      }

      // Clear any pending timeouts
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }

      // Reset the state
      setMessages([]);
      setLiveTranscript("");
      setInterimTranscript("");
      setIsLoading(false);
    };

    // Attach the event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Load API key from localStorage or prompt the user
  useEffect(() => {
    const storedApiKey = OPEN_AI_KEY;
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      const userApiKey = prompt("Please enter your OpenAI API key:");
      if (userApiKey) {
        localStorage.setItem("openai_api_key", userApiKey);
        setApiKey(userApiKey);
      }
    }
  }, []);

  // Countdown timer for the interview start
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

  // Scroll to the bottom of the chat when messages or interimTranscript update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, interimTranscript]);

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

      Array.from(event.results).forEach((result, index) => {
        if (result.isFinal) {
          finalTranscript += result[0].transcript.trim() + " ";
        } else {
          interimTranscript += result[0].transcript.trim() + " ";
        }
      });

      setLiveTranscript((prev) => (finalTranscript ? finalTranscript : prev));
      setInterimTranscript(interimTranscript);

      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      noSpeechTimeoutRef.current = setTimeout(() => {
        if (!finalTranscript.trim() && !interimTranscript.trim()) {
          repeatLastQuestion();
        }
      }, 10000);

      if (finalTranscript) {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
          handleSend(finalTranscript.trim());
        }, 2000);
      }
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

  // Start speech recognition
  const startRecognition = () => {
    if (!isRecognitionActive.current && recognitionRef.current) {
      recognitionRef.current.start();
      isRecognitionActive.current = true;
      setIsListening(true);
    }
  };

  // Stop speech recognition
  const stopRecognition = () => {
    if (isRecognitionActive.current && recognitionRef.current) {
      recognitionRef.current.stop();
      isRecognitionActive.current = false;
      setIsListening(false);
    }
  };

  // Restart speech recognition
  const restartRecognition = () => {
    stopRecognition();
    setTimeout(() => startRecognition(), 500);
  };

  // Initialize the conversation with a greeting from the AI
  const initiateConversation = () => {
    const initialMessage = {
      id: "1",
      content:
        "Hi, I'm Riya! I'll be conducting your interview today. Could you please introduce yourself and tell me about your professional background?",
      role: "assistant",
      timestamp: Date.now(),
    };
    setMessages([initialMessage]);
    speak(initialMessage.content);
  };

  // Handle sending a message to the AI
  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    stopRecognition();

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLiveTranscript("");
    setInterimTranscript("");
    setIsLoading(true);

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          response.choices[0]?.message?.content ||
          "I couldn't generate a response. Please try again.",
        role: "assistant",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      speak(aiMessage.content);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch AI response.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Repeat the last question if no speech is detected
  const repeatLastQuestion = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      const repeatedQuestion = `I repeat: ${lastMessage.content}`;
      speak(repeatedQuestion);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: repeatedQuestion,
          role: "assistant",
          timestamp: Date.now(),
        },
      ]);
    }
  };

  // Speak the AI's response using text-to-speech
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => startRecognition();

      stopRecognition();
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Error",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      {isTimerRunning ? (
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
                        {interimTranscript ? "Listening..." : "Sending..."}
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* Empty div to track the latest message */}
                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>
          </ScrollArea>
          <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-3xl mx-auto flex justify-center">
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
            </div>
          </div>
        </>
      )}
    </div>
  );
};

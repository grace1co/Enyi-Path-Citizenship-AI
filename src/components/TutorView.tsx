import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage, StudySession } from "../types";
import {
  Send,
  Sparkles,
  Brain,
  MessageSquare,
  HelpCircle,
  Loader,
  RefreshCw,
  UserCheck,
  Award,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Eye,
  EyeOff,
  Square,
  Copy,
  Check,
  Database,
  ExternalLink
} from "lucide-react";
import { speakText, stopSpeaking } from "../utils/speech";

interface TutorViewProps {
  chatHistory: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
  onAddSession?: (session: StudySession) => void; // Optional if you want to notify App.tsx of mock exam completion!
  token: string | null;
  settings?: any;
  setSettings?: any;
}

export default function TutorView({
  chatHistory,
  onAddMessage,
  onClearHistory,
  onAddSession,
  token,
  settings,
  setSettings,
}: TutorViewProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<"standard" | "interview">("standard");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Voice controls
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechActiveId, setSpeechActiveId] = useState<string | null>(null);

  // Voice interview controls.
  const [conversationMode, setConversationMode] = useState(false);
  const [slowSpeechMode, setSlowSpeechMode] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [lastOfficerQuestion, setLastOfficerQuestion] = useState<string | null>(null);
  const [revealedMessages, setRevealedMessages] = useState<Record<string, boolean>>({});

  // Saved/Previous Conversations memory list & Mock Interview Simulator State
  const [selectedHistoryTopic, setSelectedHistoryTopic] = useState<string | null>(null);
  const [interviewState, setInterviewState] = useState<"idle" | "running" | "completed">("idle");
  const [interviewScore, setInterviewScore] = useState(0);
  const [interviewQuestionsCount, setInterviewQuestionsCount] = useState(0);
  const [officerDecision, setOfficerDecision] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [interruptedMessage, setInterruptedMessage] = useState<{ id: string; text: string } | null>(null);

  // Interview settings and report state.
  const [personality, setPersonality] = useState<"real" | "friendly" | "tutor">("real");
  const [drillType, setDrillType] = useState<string>("all");
  const [analyzingReport, setAnalyzingReport] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<any | null>(null);

  // Saved interview notes and recommended practice state.
  const [liveOfficerNotes, setLiveOfficerNotes] = useState<string[]>([]);
  const [expandedQaIndex, setExpandedQaIndex] = useState<number | null>(null);
  const [pastCaseRecords, setPastCaseRecords] = useState<any[]>([]);
  const [todayCoachGoal, setTodayCoachGoal] = useState<string | null>(null);

  // Interview notes and recommendations
  useEffect(() => {
    // Check if Progress tab sent a drill recommendation
    const preTriggerVal = localStorage.getItem("enyi_pre_trigger_drill");
    if (preTriggerVal) {
      try {
        const parsed = JSON.parse(preTriggerVal);
        localStorage.removeItem("enyi_pre_trigger_drill");
        setActiveMode(parsed.mode || "interview");
        setDrillType(parsed.drillType || "all");
        
        // Push small notice message
        const noticeMsg = `Welcome to your recommended ${parsed.drillType.toUpperCase()} drill! Press 'Start Mock Interview' as soon as you are ready, and Enyi AI Officer will focus on this weakness category.`;
        onAddMessage({
          id: "coach_notify_" + Date.now(),
          role: "model",
          content: noticeMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setLastOfficerQuestion(noticeMsg);
      } catch (e) {
        console.warn("Failed to trigger practice preset:", e);
      }
    }

    // Load previous interview results for the coaching goal
    const cachedHistory = localStorage.getItem("enyi_interview_history");
    if (cachedHistory) {
      try {
        const parsedHist = JSON.parse(cachedHistory);
        setPastCaseRecords(parsedHist);
        
        if (parsedHist.length > 0) {
          const lastReview = parsedHist[0];
          // Interactive today goal text
          let goalTopic = "full interview pacing";
          if (lastReview.drillType === "travel") goalTopic = "travel trip chronological math";
          if (lastReview.drillType === "personal") goalTopic = "N-400 biographical consistency";
          if (lastReview.drillType === "moral") goalTopic = "Good Moral Character Yes/No definition meanings";
          if (lastReview.breakdown?.civics < 80) goalTopic = "civics landmark history facts";

          setTodayCoachGoal(`Last time you struggled with ${goalTopic}. Keep practicing.`);
        }
      } catch (ex) {
        console.warn("Failed checking case logs:", ex);
      }
    }
  }, []);

  // Interview state
  const [interviewFlowState, setInterviewFlowState] = useState<"idle" | "speaking" | "listening" | "review" | "thinking">("idle");
  const [isOfficerPaused, setIsOfficerPaused] = useState(false);

  // Refs used by speech features
  const conversationModeRef = useRef(conversationMode);
  const interviewStateRef = useRef<"idle" | "running" | "completed">("idle");
  const loadingRef = useRef(loading);
  const slowSpeechModeRef = useRef(slowSpeechMode);
  const voiceEnabledRef = useRef(voiceEnabled);
  const latestTextRef = useRef("");
  const autoSubmitTimeoutRef = useRef<any>(null);
  const interviewFlowStateRef = useRef(interviewFlowState);

  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);

  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    slowSpeechModeRef.current = slowSpeechMode;
  }, [slowSpeechMode]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    latestTextRef.current = inputText;
  }, [inputText]);

  useEffect(() => {
    interviewFlowStateRef.current = interviewFlowState;
  }, [interviewFlowState]);

  // Stop speech when the user leaves this page
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, []);

  // Speech-to-Text Recognition State and Hooks
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListeningAutomatically = () => {
    if (!recognitionRef.current) {
      console.warn("Speech recognition is unavailable.");
      return;
    }
    // Lock the mic if actively reading the response
    if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
      console.warn("Speech synthesis is currently speaking. Microphone automatic start locked.");
      return;
    }
    try {
      setInputText("");
      latestTextRef.current = "";
      setSpeechError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.warn("Auto-start speech recognition failed/already active:", err);
    }
  };

  const handleOfficerSpeakEnd = () => {
    setSpeechActiveId(null);
    setIsOfficerPaused(false);
    if (interviewStateRef.current === "running") {
      setInterviewFlowState("listening"); // Transition to listening
      if (conversationModeRef.current && !loadingRef.current) {
        startListeningAutomatically();
      }
    } else {
      if (conversationModeRef.current && !loadingRef.current) {
        startListeningAutomatically();
      }
    }
  };

  const handlePauseOfficerToggle = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (isOfficerPaused) {
      window.speechSynthesis.resume();
      setIsOfficerPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsOfficerPaused(true);
    }
  };

  const handleSkipAudio = () => {
    stopSpeaking();
    handleOfficerSpeakEnd();
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
          if (interviewStateRef.current === "running") {
            setInterviewFlowState("listening");
          }
        };

        rec.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Show the live transcript while the user speaks.
          if (finalTranscript || interimTranscript) {
            const currentCombined = (finalTranscript + interimTranscript).trim();
            if (currentCombined) {
              setInputText(currentCombined);
              latestTextRef.current = currentCombined;

              // If Enyi mock interview is active, deal with the state transition to State 3 Review
              if (interviewStateRef.current === "running") {
                // If Automated Conversation Mode is active, debounce auto-transition to Review State!
                if (conversationModeRef.current) {
                  if (autoSubmitTimeoutRef.current) {
                    clearTimeout(autoSubmitTimeoutRef.current);
                  }
                  autoSubmitTimeoutRef.current = setTimeout(() => {
                    // Decide we're done after silence -> go to State 3: REVIEW
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.stop();
                      } catch (e) {}
                    }
                    setInterviewFlowState("review");
                  }, 2500); // 2.5 seconds of silence before transitioning to review state.
                }
              } else {
                if (conversationModeRef.current) {
                  if (autoSubmitTimeoutRef.current) {
                    clearTimeout(autoSubmitTimeoutRef.current);
                  }
                  autoSubmitTimeoutRef.current = setTimeout(() => {
                    const finalTxt = latestTextRef.current;
                    if (finalTxt && finalTxt.trim()) {
                      handleSendPrompt(finalTxt);
                      if (recognitionRef.current) {
                        try {
                          recognitionRef.current.stop();
                        } catch (e) {}
                      }
                    }
                  }, 3500);
                }
              }
            }
          }
        };

        rec.onerror = (err: any) => {
          console.warn("Speech Recognition Error:", err);
          setIsListening(false);
          if (err.error === "not-allowed") {
            setSpeechError("Microphone blocked. Please grant microphone access in your browser or click the 'Open in New Tab' icon to open the app outside of the preview window!");
          } else {
            setSpeechError(`Speech recognition status: ${err.error || 'could not start'}. Please use Chrome or Safari, or open the app in a new tab!`);
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore abort errors
        }
      }
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    setSpeechError(null);
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }

    // Stop speaking if the AI is currently responding
    const isSpeakingActive = speechActiveId || (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking);
    if (isSpeakingActive) {
      let contentToInterrupt = "";
      let idToInterrupt = speechActiveId || "current";

      if (speechActiveId) {
        const activeMsg = chatHistory.find(m => m.id === speechActiveId);
        contentToInterrupt = activeMsg ? activeMsg.content : (speechActiveId === "repeat" ? lastOfficerQuestion || "" : "");
      } else {
        contentToInterrupt = lastOfficerQuestion || "";
      }

      if (contentToInterrupt) {
        setInterruptedMessage({ id: idToInterrupt, text: contentToInterrupt });
      }

      stopSpeaking();
      setSpeechActiveId(null);
      setIsOfficerPaused(false);

      if (interviewStateRef.current === "running") {
        setInterviewFlowState("review"); // Transition to review state instead of listening, giving user full control
      }
      return; // Return early so mic does not start immediately while speech synthesis was speaking
    }

    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported in this browser version. Try using Google Chrome, Safari, or Microsoft Edge for full speech-to-text features.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      if (interviewStateRef.current === "running") {
        setInterviewFlowState("review");
      }
    } else {
      try {
        // DO NOT wipe the input field on manual click, allowing users to keep whatever they already typed/begun!
        recognitionRef.current.start();
        if (interviewStateRef.current === "running") {
          setInterviewFlowState("listening");
        }
      } catch (err) {
        console.error("Speech recognition start failed:", err);
        setIsListening(false);
        setSpeechError("Could not start microphone search. Please check your browser's audio permissions.");
      }
    }
  };

  const handleResumeSpeech = () => {
    if (!interruptedMessage) return;
    const { id, text } = interruptedMessage;
    setInterruptedMessage(null);
    speakText(
      text,
      () => setSpeechActiveId(id),
      () => {
        handleOfficerSpeakEnd();
      },
      slowSpeechMode ? 0.72 : 0.92
    );
  };

  const previousConversations = {
    "Electoral College": [
      {
        id: "prev_e_1",
        role: "user" as const,
        content: "Explain the Electoral College simply for a newcomer.",
        timestamp: "Yesterday, 3:45 PM"
      },
      {
        id: "prev_e_2",
        role: "model" as const,
        content: "The Electoral College (Electoral College) is the official system used to elect the U.S. President. \n\nInstead of voting directly for the president, citizens vote for 'selectors' (Electoral votes) from their state. Each state gets a set value of electors depending on its population (for example, California has 54, while Wyoming has 3).\n\nIn almost all states, the candidate who wins the most citizen votes takes ALL of that state's electoral votes. To win the presidency, a candidate needs a majority of 270 electoral votes out of 538 total.",
        timestamp: "Yesterday, 3:46 PM"
      },
      {
        id: "prev_e_3",
        role: "user" as const,
        content: "Why doesn't the candidate with the most citizen votes always win?",
        timestamp: "Yesterday, 3:48 PM"
      },
      {
        id: "prev_e_4",
        role: "model" as const,
        content: "Excellent question! Since it is a 'winner-take-all' system in most states, a candidate can win a state by a tiny fraction and gain all of its electors, while losing massively in another state. This has occurred 5 times in U.S. History, most recently in 2016. It ensures small states still have representatives rather than just big cities controlling elections.",
        timestamp: "Yesterday, 3:50 PM"
      }
    ],
    "Federalism system": [
      {
        id: "prev_f_1",
        role: "user" as const,
        content: "What is federalism?",
        timestamp: "2 days ago, 10:15 AM"
      },
      {
        id: "prev_f_2",
        role: "model" as const,
        content: "Federalism (Federalism) is a system of government where power is shared between the Federal Government (national level in Washington, D.C.) and State Governments (individual states).\n\nUnder our Constitution:\n- **Federal Powers**: Coining money, declaring war, creating treaties, and running the post office.\n- **State Powers**: Licensing drivers, providing schools and safety, and managing local zone laws.",
        timestamp: "2 days ago, 10:17 AM"
      }
    ],
    "1800 Civil War reasons": [
      {
        id: "prev_c_1",
        role: "user" as const,
        content: "Why did the Civil War happen?",
        timestamp: "3 days ago, 1:12 PM"
      },
      {
        id: "prev_c_2",
        role: "model" as const,
        content: "The American Civil War (Civil War) was fought from 1861 to 1865. The primary causes were:\n\n1. **Slavery**: Southern states relies on slave labor and wanted to spread it to new territories. Northern states opposed this expansion.\n2. **State Rights**: Southern states argued they had the power to ignore federal laws of slavery (Secession).\n3. **Election of Lincoln**: When Abraham Lincoln was elected President, 11 Southern states broke away to form the Confederacy, leading to conflict to save the Union.",
        timestamp: "3 days ago, 1:15 PM"
      }
    ]
  };

  const standardSuggestions = [
    "Explain branches of gov in simple terms",
    "Why was Abraham Lincoln crucial?",
    "Mnemonic tricks to remember rights",
    "What is the checks & balances system?",
  ];

  const interviewSuggestions = [
    "Start simulation: Begin oral check",
    "I am ready for the USCIS Oral Civics questions",
    "How do I answer Phase 1 N-400 questions?"
  ];

  const activeSuggestions = activeMode === "standard" ? standardSuggestions : interviewSuggestions;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const handleLoadHistoryTopic = (topic: string) => {
    onClearHistory();
    setSelectedHistoryTopic(topic);
    setActiveMode("standard");

    const historyThread = previousConversations[topic as keyof typeof previousConversations];
    historyThread.forEach(msg => {
      onAddMessage(msg);
    });
  };

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setInterruptedMessage(null);
    if (activeMode === "interview") {
      setInterviewFlowState("thinking"); // State 4: Officer Thinking
    }

    // Clear any active automatic submit timeouts immediately to prevent double posts
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }

    // Turn off active mic recording if sending is triggered
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onAddMessage(userMsg);
    setInputText("");
    setLoading(true);

    if (activeMode === "interview" && interviewState === "running") {
      const addedDiagNotes = [...liveOfficerNotes];
      const textLower = textToSend.toLowerCase();

      if (textLower.includes("uh") || textLower.includes("um") || textLower.includes("maybe") || textLower.includes("like") || textLower.includes("think") || textLower.includes("pardon")) {
        addedDiagNotes.push(`Question #${interviewQuestionsCount + 1}: Exhibit of verbal hesitation/restructuring markers during direct address.`);
      }

      const wordCount = textToSend.trim().split(/\s+/).length;
      if (wordCount > 16) {
        addedDiagNotes.push(`Question #${interviewQuestionsCount + 1}: Elongated response (${wordCount} words) with high descriptive detail (preferred: concise single-sentence legal expressions).`);
      } else if (wordCount <= 3 && wordCount > 0) {
        addedDiagNotes.push(`Question #${interviewQuestionsCount + 1}: Optimal briefing brevity (${wordCount} words expressed clearly).`);
      }

      if (drillType === "travel" || drillType === "all") {
        if (textLower.includes("trip") || textLower.includes("mexico") || textLower.includes("canada") || textLower.includes("vacation") || textLower.includes("days")) {
          addedDiagNotes.push(`Question #${interviewQuestionsCount + 1}: Verified travel indicators. Applicant logged details that require comparison with filing transcripts.`);
        }
      }

      if (drillType === "moral") {
        if (textLower.includes("no") && (textLower.includes("never") || textLower.includes("not"))) {
          addedDiagNotes.push(`Question #${interviewQuestionsCount + 1}: Optimal positive moral confirmation expressed ("No, never").`);
        }
      }

      setLiveOfficerNotes(addedDiagNotes);
    }

    if (activeMode === "interview" && interviewState === "idle") {
      setInterviewState("running");
    }

    try {
      const historyContext = [...chatHistory, userMsg];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: historyContext,
          mode: activeMode,
          personality,
          drillType,
          language: settings?.explanationLanguage || "English",
        }),
      });

      if (!response.ok) {
        throw new Error("Tutor backend endpoint failure");
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: "ai_" + Date.now(),
        role: "model",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources,
      };
      
      onAddMessage(aiMsg);
      setLastOfficerQuestion(aiMsg.content);

      if (voiceEnabledRef.current) {
        if (activeMode === "interview" && interviewStateRef.current === "running") {
          setInterviewFlowState("speaking"); // State 1: Officer Speaking
        }
        speakText(
          aiMsg.content,
          () => setSpeechActiveId(aiMsg.id),
          () => {
            handleOfficerSpeakEnd();
          },
          slowSpeechModeRef.current ? 0.72 : 0.92
        );
      } else {
        if (activeMode === "interview" && interviewStateRef.current === "running") {
          setInterviewFlowState("speaking"); // State 1: Officer Speaking
          if (conversationModeRef.current) {
            setTimeout(() => {
              if (conversationModeRef.current && interviewStateRef.current === "running" && !loadingRef.current) {
                handleOfficerSpeakEnd(); // Transitions naturally to State 2
              }
            }, 4500);
          }
        } else {
          if (conversationModeRef.current) {
            setTimeout(() => {
              if (conversationModeRef.current && !loadingRef.current) {
                 startListeningAutomatically();
              }
            }, 3500);
          }
        }
      }

      if (activeMode === "interview" && interviewState === "running") {
        const lowerRes = data.content.toLowerCase();
        
        setInterviewQuestionsCount((c) => c + 1);

        // Simple evaluation logic for oral response simulation
        if (lowerRes.includes("correct") || lowerRes.includes("yes") || lowerRes.includes("excellent")) {
          setInterviewScore((s) => s + 1);
        }

        // End the mock interview after five questions
        if (interviewQuestionsCount >= 4) {
          setInterviewState("completed");
          const decisionText = `OFFICIAL DECISION: Officer Enyi has completed your review. SCORE: ${interviewScore + 1}/5. STATUS: PASSED/COMPLETED!`;
          setOfficerDecision(decisionText);

          if (onAddSession) {
            onAddSession({
              id: "ses_int_" + Date.now(),
              date: "Just Now",
              module: `USCIS Drill: ${drillType === "all" ? "Mock N-400 & Civics" : drillType.toUpperCase()}`,
              score: interviewScore + 1,
              totalQuestions: 5,
              type: "Interview"
            });
          }

          generateReadinessReport([...historyContext, aiMsg]);
        }
      }

    } catch (err: any) {
      console.error(err);
      onAddMessage({
        id: "ai_err_" + Date.now(),
        role: "model",
        content: "I apologize, but Enyi AI is momentarily organizing textbooks. Please ensure your setup contains active API credentials and try again shortly!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setLoading(false);
    }
  };

  const OFFLINE_QUESTIONS_DETAILS = [
    {
      question: "Can you state your full legal name and define what 'naturalization' means?",
      expectedKeywords: ["citizen", "become", "legal", "process"],
      acceptedAnswer: "The legal process to become a United States citizen.",
      category: "General Biography",
      failReason: "USCIS expects direct comprehension. If you cannot explain the legal terms in your application, the officer can delay naturalization for English requirements."
    },
    {
      question: "Have you taken any trips outside of the United States in the last five years?",
      expectedKeywords: ["yes", "no", "dates", "trip", "travel"],
      acceptedAnswer: "Yes / No travel history matching your N-400 records.",
      category: "N-400: Travel History",
      failReason: "Date discrepancies between oral response and N-400 written filings often trigger intensive audits. Ensure trip counts match."
    },
    {
      question: "supreme law of the land",
      expectedKeywords: ["constitution"],
      acceptedAnswer: "The Constitution.",
      category: "Civics: Principles",
      failReason: "Must name 'The Constitution' precisely. Saying 'rules' or 'Congress laws' is insufficient."
    },
    {
      question: "What does the Constitution do?",
      expectedKeywords: ["government", "set", "basic", "rights"],
      acceptedAnswer: "Sets up the government, defines the government, or protects basic rights of Americans.",
      category: "Civics: Government",
      failReason: "Too vague. USCIS expects standard constitutional concepts like 'defines the government' or 'protects basic rights'."
    },
    {
      question: "first three words of the Constitution",
      expectedKeywords: ["we", "people"],
      acceptedAnswer: "We the People.",
      category: "Civics: Self-Government",
      failReason: "You must cite 'We the People' exactly to represent the concept of self-governance."
    },
    {
      question: "How many amendments does the Constitution have?",
      expectedKeywords: ["27", "twenty-seven"],
      acceptedAnswer: "27 (twenty-seven).",
      category: "Civics: Rights",
      failReason: "Must specify the correct total number of amendments (twenty-seven)."
    },
    {
      question: "What is one right or freedom from the First Amendment?",
      expectedKeywords: ["speech", "religion", "assembly", "press", "petition"],
      acceptedAnswer: "Speech, religion, assembly, press, or petition the government.",
      category: "Civics: Rights",
      failReason: "Ensure naming one exact constitutional item from: speech, religion, assembly, press, or petition."
    },
    {
      question: "Who was President during the Civil War?",
      expectedKeywords: ["lincoln", "abraham"],
      acceptedAnswer: "Abraham Lincoln.",
      category: "Civics: History",
      failReason: "Abraham Lincoln. Naming other war figures is incorrect."
    },
    {
      question: "Name one war fought by the United States in the 1800s.",
      expectedKeywords: ["civil", "1812", "mexican", "spanish"],
      acceptedAnswer: "Civil War, War of 1812, Mexican-American War, or Spanish-American War.",
      category: "Civics: History",
      failReason: "Ensure the war indeed matches the 1800s era. World War I is in the 1900s, which is a frequent error."
    },
    {
      question: "What is one responsibility that is only for United States citizens?",
      expectedKeywords: ["jury", "vote"],
      acceptedAnswer: "Serve on a jury or vote in a federal election.",
      category: "Civics: Responsibilities",
      failReason: "Serving on a jury or voting in federal elections are exclusive responsibilities limited only to citizens."
    },
    {
      question: "claimed to be a U.S. citizen",
      expectedKeywords: ["no", "never"],
      acceptedAnswer: "No, never.",
      category: "N-400: Moral Character",
      failReason: "Claiming citizenship falsely is a permanent bar to naturalization. You must state 'No' directly with absolute clarity."
    },
    {
      question: "willing to take the full Oath of Allegiance",
      expectedKeywords: ["yes", "willing"],
      acceptedAnswer: "Yes, I am willing.",
      category: "N-400: Oath of Allegiance",
      failReason: "Must declare absolute allegiance and willingness to defend principles of the United States."
    }
  ];

  const compileQaPairsList = (messages: ChatMessage[]) => {
    const list = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "user") {
        const userAns = messages[i].content;
        
        // Skip standard activation phrases
        const userAnsLower = userAns.toLowerCase();
        if (userAnsLower.includes("start mock") || userAnsLower.includes("start drill")) {
          continue;
        }

        // Find preceding model question
        let prevQuestion = "Official Officer greeting or query.";
        for (let j = i - 1; j >= 0; j--) {
          if (messages[j].role === "model") {
            prevQuestion = messages[j].content;
            break;
          }
        }
        
        let acceptedText = "Direct, factual response confirming N-400 eligibility criteria.";
        let matchedKeywords: string[] = [];
        let category = "Biography";
        let failReason = "Answers must be factually consistent and avoid filler hesitations like 'uh' or 'I think'.";

        // Attempt exact matching on detailed question parameters
        const lowerQ = prevQuestion.toLowerCase();
        const matchedOffline = OFFLINE_QUESTIONS_DETAILS.find(o => 
          lowerQ.includes(o.question.toLowerCase().slice(0, 16)) || 
          o.question.toLowerCase().includes(lowerQ.slice(0, 16))
        );

        if (matchedOffline) {
          acceptedText = matchedOffline.acceptedAnswer;
          matchedKeywords = matchedOffline.expectedKeywords;
          category = matchedOffline.category;
          failReason = matchedOffline.failReason;
        } else {
          // Rule base matching heuristics for AI mode dynamic questions
          if (lowerQ.includes("constitut")) {
            acceptedText = "The Constitution, the supreme law of the land.";
            matchedKeywords = ["constitution"];
            category = "Civics: Principles & Government";
          } else if (lowerQ.includes("president") && lowerQ.includes("civil war")) {
            acceptedText = "Abraham Lincoln.";
            matchedKeywords = ["lincoln"];
            category = "Civics: History";
          } else if (lowerQ.includes("trip") || lowerQ.includes("travel")) {
            acceptedText = "Chronological trip counts and durations exactly as filed.";
            category = "N-400: Travel History";
            failReason = "Officers verify discrepancies carefully. Stumbling on dates raises credibility concerns.";
          } else if (lowerQ.includes("work") || lowerQ.includes("employ")) {
            acceptedText = "Your specific company name and legal profession titles.";
            category = "N-400: Employment details";
            failReason = "State simple direct employment facts. Avoid long winding descriptions.";
          }
        }

        list.push({
          question: prevQuestion,
          answer: userAns,
          category,
          matchedKeywords,
          acceptedAnswer: acceptedText,
          failReason
        });
      }
    }
    return list;
  };

  const generateReadinessReport = async (messagesHistory: ChatMessage[], isPartialValue: boolean = false) => {
    setAnalyzingReport(true);
    setEvaluationReport(null);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          messages: messagesHistory, 
          isPartial: isPartialValue,
          liveNotes: liveOfficerNotes
        }),
      });
      if (response.ok) {
        const report = await response.json();
        
        // Build interactive Q&A fails breakdown
        const enrichedReport = {
          ...report,
          qaPairsList: compileQaPairsList(messagesHistory)
        };
        
        setEvaluationReport(enrichedReport);

        // Append to historical local records instantly
        const newCaseItem = {
          id: "case_" + Date.now(),
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          drillType: drillType,
          personality: personality,
          score: enrichedReport.score || 80,
          outcome: enrichedReport.outcome || "PARTIAL_COMPLETED",
          breakdown: enrichedReport.breakdown || { civics: 80, fluency: 80, confidence: 80, clarity: 80, n400: 80, readiness: 80 },
          whatWentWell: enrichedReport.whatWentWell || [],
          areasToImprove: enrichedReport.areasToImprove || [],
          followUpQuestions: enrichedReport.followUpQuestions || [],
          officerNotes: enrichedReport.officerNotes || "Mock Officer report successfully recorded to diagnostic files.",
          qaPairsList: enrichedReport.qaPairsList || []
        };
        
        const cached = localStorage.getItem("enyi_interview_history");
        const currentHist = cached ? JSON.parse(cached) : [];
        const updatedHist = [newCaseItem, ...currentHist];
        localStorage.setItem("enyi_interview_history", JSON.stringify(updatedHist));
        setPastCaseRecords(updatedHist);
      } else {
        console.warn("Failed to generate report");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingReport(false);
    }
  };

  // Automated/Interactive oral interview safety controls
  const handleTryAgain = () => {
    stopSpeaking();
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    setInputText("");
    latestTextRef.current = "";
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setTimeout(() => {
      startListeningAutomatically();
    }, 300);
  };

  const handleRepeatQuestion = () => {
    if (!lastOfficerQuestion) return;
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    stopSpeaking();
    speakText(
      lastOfficerQuestion,
      () => setSpeechActiveId("repeat"),
      () => {
        handleOfficerSpeakEnd();
      },
      slowSpeechMode ? 0.72 : 0.92
    );
  };

  const handleSkipQuestion = () => {
    handleSendPrompt("Skip to the next question, please.");
  };

  const handleStopInterview = () => {
    stopSpeaking();
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Generate a partial report if the user exits mid-interview
    const userAnswers = chatHistory.filter((m) => m.role === "user");
    if (userAnswers.length > 0 && interviewState === "running") {
      setInterviewState("completed");
      setInterviewFlowState("thinking");
      setOfficerDecision("OFFICIAL DECISION: Mock terminated early by Applicant. Compiling partial assessment report below.");
      generateReadinessReport([...chatHistory], true);
    } else {
      setInterviewFlowState("idle");
      setInterviewState("idle");
      setInterviewScore(0);
      setInterviewQuestionsCount(0);
      setOfficerDecision(null);
      setLastOfficerQuestion(null);
      setEvaluationReport(null);
      setAnalyzingReport(false);
      onClearHistory();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(inputText);
  };

  const handleModeToggle = (mode: "standard" | "interview") => {
    setActiveMode(mode);
    setSelectedHistoryTopic(null);
    onClearHistory(); // clear screen to start fresh for context
    
    // Reset interview & synthesis parameters safely
    setInterviewFlowState("idle");
    setInterviewState("idle");
    setInterviewScore(0);
    setInterviewQuestionsCount(0);
    setOfficerDecision(null);
    setLastOfficerQuestion(null);
    stopSpeaking();
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }

    const welcomeMsg = mode === "standard"
      ? "Greetings! I am Enyi AI, your citizenship study partner. Ask me any question about American governance, rights, or historical events, and I will explain in simple terms."
      : "Welcome to the USCIS Oral Mock Officer Simulation! I will play the role of an official USCIS immigration testing officer. Let's practice! Reply with 'Start Mock' when you are ready, and I will ask you 10 questions one-by-one.";

    const msgId = "ai_welcome_" + Date.now();
    onAddMessage({
      id: msgId,
      role: "model",
      content: welcomeMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setLastOfficerQuestion(welcomeMsg);

    if (voiceEnabled) {
      speakText(
        welcomeMsg,
        () => setSpeechActiveId(msgId),
        () => setSpeechActiveId(null),
        slowSpeechMode ? 0.72 : 0.92
      );
    }
  };

  const handleStartSimRoom = () => {
    setLiveOfficerNotes([]);
    setExpandedQaIndex(null);
    setInterviewScore(0);
    setInterviewQuestionsCount(0);

    handleModeToggle("interview");
    setInterviewState("running");
    setInterviewFlowState("thinking");
    setVoiceEnabled(true);
    setConversationMode(true);
    const startTxt = drillType === "all" 
      ? "Start Mock N-400 & Civics Exam" 
      : `Start Drill: Let's practice the ${drillType.replace("_", " ")} interview section.`;
    handleSendPrompt(startTxt);
  };

  const handleResetSim = () => {
    setLiveOfficerNotes([]);
    setExpandedQaIndex(null);
    setInterviewScore(0);
    setInterviewQuestionsCount(0);

    setEvaluationReport(null);
    setAnalyzingReport(false);
    setInterviewFlowState("idle");
    handleModeToggle("interview");
  };

  return (
    <div id="tutor-view" className="max-w-4xl mx-auto min-w-0 flex flex-col xl:grid xl:grid-cols-12 gap-6 h-[calc(100vh-185px)] sm:h-[calc(100vh-140px)] min-h-[480px] sm:min-h-[550px] animate-fade-in py-1 font-sans">
      <div 
        className={`${
          showMobileSidebar 
            ? "fixed inset-0 z-50 bg-black/40 flex justify-start p-4 transition-opacity" 
            : "hidden xl:flex xl:col-span-4"
        } h-full select-none`}
        onClick={() => setShowMobileSidebar(false)}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`${
            showMobileSidebar
              ? "bg-white w-full max-w-[280px] h-full rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-5 animate-slide-left overflow-y-auto relative border border-[#e5e7eb] z-50"
              : "bg-white border border-[#e5e7eb] rounded-xl p-5 flex flex-col justify-between space-y-5 shrink-0 h-full overflow-y-auto w-full"
          }`}
        >
          <div className="space-y-4">
            {showMobileSidebar && (
              <div className="flex justify-between items-center border-b border-gray-150 pb-2 mb-2">
                <span className="font-bold text-xs text-gray-700">Tutor Settings</span>
                <button
                  type="button"
                  onClick={() => setShowMobileSidebar(false)}
                  className="text-gray-400 hover:text-gray-800 font-bold text-lg px-2 py-0.5 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-primary font-bold text-md border-b border-gray-50 pb-3">
              <Brain className="w-4 h-4 text-primary" />
              <span>Study Modes</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  handleModeToggle("standard");
                  setShowMobileSidebar(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
                  activeMode === "standard" && !selectedHistoryTopic
                    ? "border-primary bg-primary-container text-primary font-medium"
                    : "border-[#e5e7eb] hover:bg-gray-50 text-gray-700 bg-white"
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold leading-none">AI Civics Explainer</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                    Ask clear answers, mnemonic tricks, or timeline summaries.
                  </p>
                </div>
              </button>

              <button
                id="mock-interview-mode-btn"
                onClick={() => {
                  handleModeToggle("interview");
                  setShowMobileSidebar(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
                  activeMode === "interview"
                    ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb] font-medium"
                    : "border-[#e5e7eb] hover:bg-gray-50 text-gray-700 bg-white"
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold leading-none">Mock USCIS Interview</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                    Simulate standard USCIS oral check questions.
                  </p>
                </div>
              </button>
            </div>

            {/* Settings for the mock interview (personality, drill type) */}
            {activeMode === "interview" && (
              <div className="bg-gray-50/70 border border-gray-150 rounded-lg p-3 space-y-3.5 text-left select-none">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wide flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-[#2563eb]" />
                    <span>Interview Personality</span>
                  </label>
                  <select
                    value={personality}
                    disabled={interviewState === "running"}
                    onChange={(e) => setPersonality(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 text-xs font-bold rounded-md p-1.5 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-gray-750 disabled:opacity-80"
                  >
                    <option value="real">Mode 1: Real USCIS Interview (Default)</option>
                    <option value="friendly">Mode 2: Practice Interview</option>
                    <option value="tutor">Mode 3: Tutor Mode</option>
                  </select>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-gray-100">
                  <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wide flex items-center gap-1">
                    <ClipboardList className="w-3 h-3 text-[#2563eb]" />
                    <span>Targeted Practice Drills</span>
                  </label>
                  <select
                    value={drillType}
                    disabled={interviewState === "running"}
                    onChange={(e) => {
                      setDrillType(e.target.value);
                      onClearHistory();
                      setInterviewScore(0);
                      setInterviewQuestionsCount(0);
                    }}
                    className="w-full bg-white border border-gray-200 text-xs font-semibold rounded-md p-1.5 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-gray-750 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">Full Mock Interview (Mixed)</option>
                    <option value="civics">Civics-Only Oral Test</option>
                    <option value="personal">N-400 Personal Information</option>
                    <option value="travel">N-400 Travel History Drill</option>
                    <option value="employment">Employment & School History</option>
                    <option value="family">Marriage & Family History</option>
                    <option value="moral">Good Moral Character Qs</option>
                    <option value="oath">Oath of Allegiance Drill</option>
                    <option value="reading_writing">Reading & Writing Practice</option>
                  </select>
                </div>
              </div>
            )}

            
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Previous Conversations</span>
              </div>
              
              <p className="text-[10px] text-gray-400 leading-snug">
                Access earlier AI tutor explanations. Click any topic to reload context threads immediately:
              </p>

              <div className="space-y-1.5" id="previous-conversations-list">
                {Object.keys(previousConversations).map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      handleLoadHistoryTopic(topic);
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors border cursor-pointer font-medium ${
                      selectedHistoryTopic === topic
                        ? "border-primary bg-primary-container text-primary"
                        : "border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="truncate">{topic}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear buttons */}
          <button
            onClick={() => {
              onClearHistory();
              setShowMobileSidebar(false);
            }}
            className="w-full flex justify-center items-center gap-1.5 border border-red-100 hover:bg-red-50 text-red-600 font-medium py-2 rounded-lg text-xs transition-colors cursor-pointer mt-auto"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      
      <div className="xl:col-span-8 min-w-0 bg-white border border-[#e5e7eb] rounded-xl flex flex-col justify-between overflow-hidden flex-grow h-full">
        {activeMode === "interview" && interviewState === "idle" ? (
          <div className="p-8 flex flex-col items-center justify-center text-center h-full space-y-6 select-none max-w-md mx-auto">
           
            <img
              alt="Prospective citizens celebrating"
              referrerPolicy="no-referrer"
              className="w-full max-w-[280px] h-32 object-contain mix-blend-multiply opacity-95 animate-fade-in"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDHd9J2nemM5qdF_H-GvbsLPOlasgPNFj0RUJUrMxo-_sUcykUUVCxUHlDOz1W8d0QZeZgFisnP7Va0sndmpee03bUGeL1eSlHd7KdrVDz5bPepaVxtOdwxZ8WsK0gxmvZCy3gn8EFlQqdeywHSMqaQrbOkTwRBIhFpuMv_iaKKL-ykrx2yyftyGglonUOPLLSrIJ1ME2tuWVacKI2swqOrl5gyxGeLue-vFGZ97mEX-zdGhx3dCTxCKHliaS5lYYTmTJrw97Hd-w"
            />

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">USCIS Oral Simulation Room</h3>
              <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                The real test has 10 oral questions. You need 6 correct to pass.
              </p>
            </div>

            {/* Show what the interview will cover */}
            <div className="w-full space-y-2 border border-gray-100 p-4 rounded-xl bg-gradient-to-br bg-gray-50/50 text-left">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Interview Phases Overview:</span>
              <div className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                <span className="text-primary font-mono font-black">1.</span>
                <span>N-400 Personal background security check</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                <span className="text-primary font-mono font-black">2.</span>
                <span>Oral Civics Questions round (5 questions)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                <span className="text-primary font-mono font-black">3.</span>
                <span>Officer Decision Report & Study recommendations</span>
              </div>
            </div>

            
            {todayCoachGoal && (
              <div className="w-full border border-amber-200/80 bg-amber-50/30 p-3 rounded-xl flex items-start gap-2.5 text-left">
                <span className="text-base text-amber-600 animate-bounce">👑</span>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-bold text-amber-800 uppercase tracking-wide block">Coaching History Log Target:</span>
                  <p className="text-[10.5px] text-amber-950/90 font-sans leading-normal font-semibold">
                    {todayCoachGoal}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleStartSimRoom}
              className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-xl text-xs shadow-md cursor-pointer tracking-wide uppercase flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-white" />
              <span>Launch {drillType === "all" ? "Mock Interview" : `${drillType.toUpperCase()} Drill`}</span>
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white px-5 py-3.5 border-b border-[#e5e7eb] flex justify-between items-center shrink-0 select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm relative">
                  <Sparkles className="w-4 h-4" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 leading-none">
                    {activeMode === "interview" ? "Officer Enyi (USCIS Simulation)" : "Enyi AI Tutor"}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-medium font-sans mt-0.5 block">
                    {activeMode === "interview" ? "Simulating Officer Interview" : "Active Study Companion"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMobileSidebar(true)}
                  className="xl:hidden p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                  title="Open Study Modes & Previous Topics"
                >
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span>Modes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    if (!next) {
                      stopSpeaking();
                      setSpeechActiveId(null);
                    }
                  }}
                  title={voiceEnabled ? "Mute automatic oral readings" : "Unmute and speak answers out loud"}
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold ${
                    voiceEnabled
                      ? "bg-[#eff6ff] text-[#2563eb] border-blue-200"
                      : "bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-600"
                  }`}
                >
                  {voiceEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                      <span className="text-[10px] hidden sm:inline">Voice On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden sm:inline">Voice Muted</span>
                    </>
                  )}
                </button>

                {activeMode === "interview" ? (
                  <span className="bg-[#2563eb] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
                    Score: {interviewScore} / 5
                  </span>
                ) : (
                  <span className="bg-primary-container text-primary text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 max-w-[120px] truncate">
                    {selectedHistoryTopic ? `History: ${selectedHistoryTopic}` : "Explainer Mode"}
                  </span>
                )}
              </div>
            </div>
            
            {activeMode === "interview" && interviewState === "running" && (
              <div className="bg-slate-50 border-b border-gray-200 p-4 shrink-0 select-none animate-fade-in text-left space-y-3">
                <div className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        interviewFlowState === "listening" ? "bg-red-400" : interviewFlowState === "speaking" ? "bg-emerald-400" : "bg-blue-400"
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        interviewFlowState === "listening" ? "bg-red-500" : interviewFlowState === "speaking" ? "bg-emerald-500" : "bg-blue-500"
                      }`}></span>
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-700">
                      Officer Enyi Simulation: <span className={conversationMode ? "text-emerald-600" : "text-blue-600"}>{conversationMode ? "Hands-Free Auto Mode" : "Manual Click Mode"}</span>
                    </span>
                  </div>
                  
                  {/* Auto-flow and slow speech buttons */}
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <button 
                      type="button" 
                      onClick={() => setConversationMode(!conversationMode)}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${conversationMode ? "bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      title={conversationMode ? "Switch to Manual microphone start" : "Switch to Hands-free automatic microphone trigger"}
                    >
                      {conversationMode ? "Auto Flow Enabled" : "Enable Auto Flow"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSlowSpeechMode(!slowSpeechMode)}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer ${slowSpeechMode ? "bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      🐢 Slow Audio
                    </button>
                  </div>
                </div>


                {interviewFlowState === "speaking" && (
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-md flex flex-col lg:flex-row items-center justify-between gap-4 animate-fade-in border border-slate-705 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse">
                          <Volume2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <span>🔊 Officer Enyi is Speaking...</span>
                          {isOfficerPaused && <span className="text-[10px] text-amber-400 font-mono">(Paused)</span>}
                        </h4>
                        <p className="text-[10.5px] text-slate-300 leading-normal">
                          Listen closely to the officer's oral questions. Microphone input is disabled.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto z-10">
                      <button
                        type="button"
                        onClick={handlePauseOfficerToggle}
                        className="flex-grow lg:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        {isOfficerPaused ? <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        <span>{isOfficerPaused ? "Resume Audio" : "Pause Officer"}</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleSkipAudio}
                        className="flex-grow lg:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-[11px] font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5 text-white" />
                        <span>Skip Audio</span>
                      </button>
                    </div>
                  </div>
                )}

                {interviewFlowState === "listening" && (
                  <div className="bg-gradient-to-r from-slate-900 to-slate-850 text-white rounded-xl p-4 shadow-md flex flex-col gap-3.5 animate-fade-in border border-slate-750 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between gap-4 z-10">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                            <Mic className="w-5 h-5 text-red-500" />
                          </div>
                          <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                        </div>
                        
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                            <span>🎤 Listening... Speak Answer Now</span>
                          </h4>
                          <p className="text-[10.5px] text-slate-300 leading-normal">
                            {conversationMode ? "Silence detection active: pause talking for 2.5 seconds to review." : "Press mic to submit."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-end gap-0.5 h-5 shrink-0 select-none pointer-events-none" title="Audio waveform visualization active">
                        {[0.6, 0.9, 0.4, 0.85, 0.3, 0.95, 0.5, 0.7].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-red-500 rounded-full transition-all text-transparent animate-pulse"
                            style={{
                              height: `${h * 100}%`,
                              animationDelay: `${i * 120}ms`,
                              animationDuration: "750ms"
                            }}
                          >
                            .
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left relative overflow-hidden">
                      <div className="absolute top-1 right-2 flex items-center gap-1 text-[8px] font-bold text-red-400 uppercase tracking-widest animate-pulse select-none">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        <span>LIVE</span>
                      </div>
                      
                      <span className="text-[8.5px] font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">Live Transcript Draft</span>
                      <div className="text-xs font-bold text-slate-100 select-text outline-none italic leading-relaxed min-h-[35px] whitespace-pre-wrap">
                        {inputText ? `“${inputText}”` : "Start speaking... your words will appear here instantly."}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          if (recognitionRef.current) {
                            try { recognitionRef.current.stop(); } catch(e){}
                          }
                          setInterviewFlowState("review");
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                        title="Finish talking and perfect draft transcript manually"
                      >
                        <Lock className="w-3.5 h-3.5 text-white" />
                        <span>Stop & Review Draft Answer</span>
                      </button>
                    </div>
                  </div>
                )}

                {interviewFlowState === "review" && (
                  <div className="bg-[#eff6ff] text-slate-800 rounded-xl p-4 shadow-md flex flex-col gap-3 animate-fade-in border border-blue-200">
                    <div className="space-y-0.5 text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#1e40af] flex items-center gap-1.5">
                        <span>📋 State 3: Review & Perfect Your Answer</span>
                      </h4>
                      <p className="text-[10.5px] text-[#2563eb] font-semibold leading-relaxed">
                        Speech checks can contain accent typos. Please check or edit the script text below before submitting it!
                      </p>
                    </div>

                    <div className="bg-white border border-blue-300 rounded-xl p-3 text-left shadow-xs transition-all focus-within:border-blue-500">
                      <span className="text-[8.5px] font-extrabold text-[#2563eb] uppercase tracking-widest block mb-1">Draft Transcript Editor</span>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your final citizenship drill answer here..."
                        className="w-full bg-white text-xs font-black text-gray-800 outline-none resize-none leading-relaxed min-h-[60px] select-all border-none focus:ring-0 p-0"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setInputText("");
                          latestTextRef.current = "";
                          setInterviewFlowState("listening");
                          setTimeout(() => {
                            startListeningAutomatically();
                          }, 300);
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-white hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title="Discard current transcript draft and speak again"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                        <span>Record Again</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector("textarea");
                          if (textarea) textarea.focus();
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-white hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title="Edit text manually"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit Manually</span>
                      </button>

                      <button
                        type="button"
                        disabled={!inputText.trim()}
                        onClick={() => {
                          handleSendPrompt(inputText);
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-primary hover:bg-[#1d4ed8] text-white text-xs font-extrabold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                        title="Submit answer draft to USCIS AI"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span>Submit Answer</span>
                      </button>
                    </div>
                  </div>
                )}


                {interviewFlowState === "thinking" && (
                  <div className="bg-slate-50 text-gray-700 rounded-xl p-4 shadow-md flex flex-col gap-3.5 animate-fade-in border border-gray-200">
                    <div className="flex items-center gap-3 z-10">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs animate-spin">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-800">⚡ State 4: Analyzing Response...</h4>
                        <p className="text-[10px] text-gray-500 font-bold">
                          Officer Enyi's evaluator is assessing correctness, vocabulary comprehension, and follow-up flags.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-150 rounded-xl p-3 grid grid-cols-2 gap-3 text-[10px] font-bold select-none text-slate-600">
                      <div className="flex items-center gap-1.5 animate-pulse" style={{ animationDelay: "100ms" }}>
                        <span className="text-blue-500 bg-blue-50 w-4 h-4 rounded-full flex items-center justify-center shrink-0">✓</span>
                        <span className="truncate">Evaluating Correctness</span>
                      </div>
                      <div className="flex items-center gap-1.5 animate-pulse" style={{ animationDelay: "220ms" }}>
                        <span className="text-indigo-500 bg-indigo-50 w-4 h-4 rounded-full flex items-center justify-center shrink-0">✓</span>
                        <span className="truncate">Rating Audio Clarity</span>
                      </div>
                      <div className="flex items-center gap-1.5 animate-pulse" style={{ animationDelay: "340ms" }}>
                        <span className="text-purple-500 bg-purple-50 w-4 h-4 rounded-full flex items-center justify-center shrink-0">✓</span>
                        <span className="truncate">Confidence & Filler Tally</span>
                      </div>
                      <div className="flex items-center gap-1.5 animate-pulse" style={{ animationDelay: "460ms" }}>
                        <span className="text-emerald-500 bg-emerald-50 w-4 h-4 rounded-full flex items-center justify-center shrink-0">✓</span>
                        <span className="truncate">Civics Decision Model</span>
                      </div>
                    </div>
                  </div>
                )}


                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200 select-none">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRepeatQuestion}
                      disabled={!lastOfficerQuestion}
                      className="py-1 px-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded text-[9.5px] font-bold text-gray-700 cursor-pointer disabled:opacity-40"
                    >
                      Repeat Question
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipQuestion}
                      className="py-1 px-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded text-[9.5px] font-bold text-gray-700 cursor-pointer"
                    >
                      Skip Question
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleStopInterview}
                    className="py-1 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded text-[9.5px] font-bold cursor-pointer"
                  >
                    Exit Simulator
                  </button>
                </div>
              </div>
            )}

            <div className="flex-grow p-4 overflow-y-auto space-y-4 max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-285px)] min-h-[250px]">
              {/* Remind user transcript is hidden (listening practice) */}
              {!showTranscript && (
                <div className="p-3 border border-amber-200 rounded-xl bg-amber-50/40 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2.5 animate-fade-in select-none text-left">
                  <span className="text-sm mt-0.5 shrink-0">🔊</span>
                  <div>
                    <strong>Listening Practice Active!</strong> The visual transcript has been hidden so you have to listen carefully to Officer Enyi. You may click on any individual text bubble to temporarily reveal it.
                  </div>
                </div>
              )}

              {chatHistory.map((msg) => {
                const isModel = msg.role === "model";
                const isPeekableHidden = !showTranscript && !revealedMessages[msg.id];
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${isModel ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"}`}
                  >

                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] ${isModel ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                      {isModel ? "AI" : "ME"}
                    </div>
                    

                    <div className="space-y-1 relative group/bubble max-w-full select-text">
                      <div
                        onClick={() => {
                          if (!showTranscript) {
                            setRevealedMessages((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }));
                          }
                        }}
                        title={showTranscript ? "" : "Click to peek at text"}
                        className={`p-3.5 rounded-lg text-xs leading-relaxed font-sans whitespace-pre-wrap relative transition-all duration-200 ${
                          isModel ? "bg-gray-50 text-gray-800 border border-[#e5e7eb] rounded-tl-none font-medium" : "bg-primary text-white rounded-tr-none font-medium"
                        } ${isPeekableHidden ? "filter blur-sm bg-gray-100/90 border-gray-300 text-gray-400 select-none cursor-pointer hover:bg-gray-100" : "text-left"}`}
                      >
                        {isPeekableHidden ? (
                          <div className="flex items-center gap-1.5 text-gray-500 font-semibold py-1 select-none">
                            <EyeOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Transcript hidden. Click to peek.</span>
                          </div>
                        ) : isModel ? (
                          <div className="text-sm leading-relaxed [&_p]:mt-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mt-2 [&_ol]:mb-2 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {msg.sources && msg.sources.length > 0 && !isPeekableHidden && (
                        <div className="mt-2 bg-slate-50 border border-slate-250 rounded-md p-2.5 max-w-sm space-y-2 text-[11px] font-sans text-left shadow-xs">
                          <div className="flex items-center justify-between text-slate-700 font-medium pb-1.5 border-b border-slate-200 select-none">
                            <div className="flex items-center gap-1.25">
                              <Database className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">
                                {msg.sources[0]?.source === "Qdrant" ? "Qdrant Vector DB" : "Local Study Fallback"}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono select-none px-1 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                              {msg.sources[0]?.source === "Qdrant" ? "index: uscis_civics" : "source: local study"}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {msg.sources.map((s, idx) => (
                              <div key={idx} className="bg-white border border-slate-100 rounded-sm p-1.5 space-y-0.75">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="font-semibold text-slate-700 truncate max-w-[70%] text-[9px]">
                                    {s.document}
                                  </span>
                                </div>
                                <p className="text-slate-500 italic leading-snug text-[9.5px] select-text">
                                  "{s.text}"
                                </p>
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.75 text-[8.5px] text-indigo-600 hover:text-indigo-800 transition-colors pt-0.5 cursor-pointer font-medium"
                                >
                                  <ExternalLink className="w-2 h-2" />
                                  <span>Official study reference source</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}


                      <div className="flex flex-wrap items-center gap-2.5 px-1 select-none">
                        <span className="text-[9px] text-gray-400 font-mono block">
                          {msg.timestamp}
                        </span>

                        {!isPeekableHidden && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (speechActiveId === msg.id) {
                                  stopSpeaking();
                                  setSpeechActiveId(null);
                                } else {
                                  speakText(
                                    msg.content,
                                    () => setSpeechActiveId(msg.id),
                                    () => setSpeechActiveId(null),
                                    slowSpeechMode ? 0.72 : 0.92
                                  );
                                }
                              }}
                              title="Listen sentence out loud"
                              className={`text-[9.5px] font-bold flex items-center gap-0.5 px-1 py-0.5 rounded transition-colors cursor-pointer ${
                                speechActiveId === msg.id 
                                  ? "text-[#2563eb] bg-blue-50" 
                                  : "text-gray-450 hover:text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>{speechActiveId === msg.id ? "Playing" : "Listen"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(msg.content);
                                setCopiedId(msg.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              title="Copy to clipboard"
                              className="text-[9.5px] font-bold flex items-center gap-0.5 px-1 py-0.5 rounded text-gray-450 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {interviewState === "completed" && (
                <div className="space-y-6 animate-fade-in my-6 select-none max-w-2xl mx-auto">

                  <div className="p-5 border border-[#10b981]/30 rounded-xl bg-emerald-50/10 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                      <Award className="w-5.5 h-10 text-emerald-600" />
                    </div>
                    <div className="space-y-1 text-center">
                      <h4 className="font-extrabold text-xs text-emerald-800 uppercase tracking-widest">Mock Drill Finished</h4>
                      <p className="text-[11px] text-gray-500">
                        Evaluations compiled successfully. Your results have been posted to your historic logs database.
                      </p>
                    </div>
                  </div>

                  {analyzingReport && (
                    <div className="p-6 border border-blue-100 rounded-xl bg-blue-50/30 text-center space-y-3.5 animate-pulse">
                      <Loader className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                      <div>
                        <h4 className="font-bold text-xs text-blue-900">Evaluating Readiness Metrics...</h4>
                        <p className="text-[10px] text-blue-600 mt-1.5 leading-normal">
                          USCIS mock analytics engine is reviewing your grammar pacing, vocabulary understanding, confidence filler tallies, and travel chronologies.
                        </p>
                      </div>
                    </div>
                  )}

                  {evaluationReport && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-md divide-y divide-gray-100 overflow-hidden text-left" id="readiness-evaluation-report-card">
                      
                    {/* Show if interview ended early */}
                    {evaluationReport.isPartialAssessment && (
                        <div className="bg-amber-50 border-b border-amber-200 p-4">
                          <div className="flex gap-2">
                            <span className="text-amber-600 text-sm">⚠️</span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">PARTIAL Assessment</h4>
                              <p className="text-[10.5px] text-amber-700 leading-normal font-medium">
                                This mock interview ended early. The report represents performance for answered questions.
                              </p>
                              {evaluationReport.untestedAreas && evaluationReport.untestedAreas.length > 0 && (
                                <div className="text-[10px] text-amber-900 font-extrabold mt-1">
                                  Untested Areas Left: {evaluationReport.untestedAreas.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}


                      <div className="p-5 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-[#2563eb] uppercase tracking-wider">Naturalization Readiness Profile</span>
                          <h3 className="text-sm font-extrabold text-gray-900">Post-Interview Readiness Report</h3>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="inline-flex items-baseline gap-1 bg-[#2563eb] text-white font-black text-xl px-4 py-1.5 rounded-xl shadow-xs">
                            <span>{evaluationReport.score}</span>
                            <span className="text-[10px] text-blue-100 font-medium">/100</span>
                          </div>
                          {evaluationReport.outcome && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              evaluationReport.outcome === "PASS"
                                ? "bg-emerald-100 text-emerald-800"
                                : evaluationReport.outcome === "FAIL"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              Outcome Likelihood: {evaluationReport.outcome}
                            </span>
                          )}
                        </div>
                      </div>


                      <div className="p-5">
                        <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">Skills Rating Grid</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { name: "Civics Knowledge", val: evaluationReport.breakdown?.civics, color: "bg-emerald-500" },
                            { name: "English Fluency", val: evaluationReport.breakdown?.fluency, color: "bg-blue-500" },
                            { name: "Answer Confidence", val: evaluationReport.breakdown?.confidence, color: "bg-purple-500" },
                            { name: "N-400 Familiarity", val: evaluationReport.breakdown?.n400, color: "bg-indigo-500" },
                            { name: "Overall Readiness", val: evaluationReport.breakdown?.readiness, color: "bg-amber-500" },
                            { name: "Response Clarity", val: evaluationReport.breakdown?.clarity, color: "bg-teal-500" },
                          ].map((metric) => (
                            <div key={metric.name} className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-bold text-gray-700">
                                <span className="truncate">{metric.name}</span>
                                <span>{metric.val || 72}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full ${metric.color} transition-all`} style={{ width: `${metric.val || 72}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>


                      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                        <div className="p-5 space-y-3">
                          <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                            <span>✅</span>
                            <span>What Went Well</span>
                          </div>
                          <ul className="space-y-2 text-[11px] text-gray-600 list-disc pl-4 leading-normal">
                            {evaluationReport.whatWentWell?.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>Areas To Improve</span>
                          </div>
                          <ul className="space-y-2 text-[11px] text-gray-600 list-disc pl-4 leading-normal">
                            {evaluationReport.areasToImprove?.map((wi: string, i: number) => (
                              <li key={i}>{wi}</li>
                            ))}
                          </ul>
                        </div>
                      </div>


                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Accent & Vocabulary Risk Detection</h4>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            evaluationReport.pronunciationRisk?.level === "Low" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : evaluationReport.pronunciationRisk?.level === "High" 
                              ? "bg-red-50 text-red-700 border border-red-100" 
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            Understanding Risk: {evaluationReport.pronunciationRisk?.level || "Medium"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-normal">
                          The examiner notes recommend reviewing these high-stakes terms to eliminate misunderstanding risks during the oral oath & verification checks:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {evaluationReport.pronunciationRisk?.drillWords?.map((w: string, i: number) => (
                            <button
                              type="button"
                              key={i}
                              onClick={() => {
                                speakText(
                                  w,
                                  () => {},
                                  () => {},
                                  0.85
                                );
                              }}
                              className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95"
                              title="Listen to official pronunciation"
                            >
                              <Volume2 className="w-3 h-3 text-blue-500" />
                              <span>{w}</span>
                            </button>
                          ))}
                        </div>
                      </div>


                      {evaluationReport.n400Vulnerabilities && evaluationReport.n400Vulnerabilities.length > 0 && (
                        <div className="p-5 space-y-3">
                          <h4 className="text-[10px] font-extrabold text-red-500 uppercase tracking-wide flex items-center gap-1">
                            <span>🚨</span> N-400 High-Stakes Interview Vulnerabilities
                          </h4>
                          <p className="text-[11px] text-gray-500 leading-normal">
                            USCIS officers are trained to probe memory gaps on application forms. Review these detected risk items:
                          </p>
                          <ul className="space-y-2 text-[11px] text-gray-600 list-disc pl-4 leading-normal">
                            {evaluationReport.n400Vulnerabilities.map((v: string, i: number) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evaluationReport.followUpQuestions && evaluationReport.followUpQuestions.length > 0 && (
                        <div className="p-5 space-y-3 bg-blue-50/25 border-t border-b border-blue-50">
                          <h4 className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                            <span>🧠</span> Personalized Follow-up Drill Exercises
                          </h4>
                          <p className="text-[11px] text-gray-600 leading-normal">
                            Real officers check conversational naturalness with unmemorized followups. Practice answering these:
                          </p>
                          <div className="space-y-2">
                            {evaluationReport.followUpQuestions.map((q: string, i: number) => (
                              <div key={i} className="flex gap-2 items-start bg-white border border-blue-100 p-2.5 rounded-lg">
                                <span className="text-[10px] bg-blue-100 text-[#1e40af] font-extrabold px-1.5 py-0.5 rounded">Q</span>
                                <p className="text-[11.5px] font-black text-gray-800 leading-normal">{q}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Did the answer sound memorized? */}
                      {evaluationReport.naturalness && (
                        <div className="p-5 space-y-3.5 bg-gray-50/50">
                          <div className="flex justify-between items-center text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">
                            <span>Conversational Pacing & Memorization</span>
                            <span className="text-gray-850 font-bold">Naturalness: {evaluationReport.naturalness.score || 82}%</span>
                          </div>
                          <div className="grid lg:grid-cols-2 gap-4">
                            <div className="bg-red-50/30 border border-red-100/60 p-3 rounded-xl space-y-1.5">
                              <span className="text-[9px] text-[#b45309] font-bold uppercase tracking-wider block">Sounded Memorized or Rehearsed</span>
                              <p className="text-[11px] text-gray-600 italic select-text leading-normal">
                                {evaluationReport.naturalness.rehearsedText || "N/A"}
                              </p>
                            </div>
                            <div className="bg-[#eff6ff] border border-blue-100 p-3 rounded-xl space-y-1.5">
                              <span className="text-[9px] text-[#1e40af] font-bold uppercase tracking-wider block">Recommended Conversational Approach</span>
                              <p className="text-[11px] text-gray-700 border-l-2 border-blue-400 pl-2 leading-normal">
                                {evaluationReport.naturalness.preferredText || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-5 space-y-2.5">
                        <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Confidence & Hesitation Notes</h4>
                        <p className="text-[11px] text-gray-600 leading-normal select-text">
                          {evaluationReport.confidenceNotes}
                        </p>
                      </div>

                      {/* Question failure analysis */}
                      {(() => {
                        const qaPairs = evaluationReport.qaPairsList || [];
                        if (qaPairs.length === 0) return null;

                        return (
                          <div className="p-5 space-y-4 border-t border-gray-150 bg-slate-50/40">
                            <div>
                              <h4 className="text-[10px] font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-1.5 select-none">
                                <span>🔍</span> Interactive Response & Failure Analysis
                              </h4>
                              <p className="text-[10.5px] text-gray-500 font-sans leading-relaxed mt-0.5">
                                Select any interview response below to expand comprehensive USCIS guidelines, expected keywords, and supervisor failure explanations.
                              </p>
                            </div>

                            <div className="space-y-3">
                              {qaPairs.map((pair: any, idx: number) => {
                                const isExpanded = expandedQaIndex === idx;
                                const cleanedAns = (pair.answer || "").toLowerCase();
                                
                                return (
                                  <div 
                                    key={idx} 
                                    className={`border rounded-xl transition-all overflow-hidden ${
                                      isExpanded 
                                        ? "bg-white border-primary shadow-xs" 
                                        : "bg-white border-gray-200 hover:border-gray-305 shadow-3xs cursor-pointer"
                                    }`}
                                    onClick={(e) => {
                                      // Avoid closing if selecting text inside expanded box
                                      if (e.target instanceof HTMLParagraphElement || e.target instanceof HTMLSpanElement) {
                                        return;
                                      }
                                      setExpandedQaIndex(isExpanded ? null : idx);
                                    }}
                                  >
                                    <div className="p-3.5 flex justify-between items-start gap-3 select-none">
                                      <div className="space-y-1 select-none">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-[9px] font-mono font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                            Q#{idx + 1}
                                          </span>
                                          <span className="text-[9.5px] font-bold uppercase text-[#1e40af] bg-blue-50 px-2 py-0.5 rounded-full">
                                            {pair.category || "Biography"}
                                          </span>
                                        </div>
                                        <h5 className="text-[11.5px] font-semibold text-gray-800 leading-normal">
                                          Officer: "{pair.question}"
                                        </h5>
                                        <p className="text-[11px] text-gray-600 font-sans font-medium italic mt-0.5">
                                          Your Spoken Answer: <span className="font-extrabold select-text">"{pair.answer}"</span>
                                        </p>
                                      </div>
                                      
                                      <span className="text-gray-400 font-bold shrink-0 text-sm mt-0.5">
                                        {isExpanded ? "▲" : "▼"}
                                      </span>
                                    </div>

                                    {isExpanded && (
                                      <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-3">
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                                          
                                          <div className="bg-emerald-50/40 border border-emerald-100/80 p-3 rounded-lg space-y-1 block">
                                            <span className="text-[9px] text-[#065f46] font-extrabold uppercase tracking-wide block select-none">
                                              Passed USCIS Formulation Guidelines:
                                            </span>
                                            <p className="text-[11px] text-gray-750 font-sans leading-normal font-medium">
                                              {pair.acceptedAnswer}
                                            </p>
                                          </div>

                                          {/* Why the answer might fail the real test */}
                                          <div className="bg-red-50/40 border border-red-100/60 p-3 rounded-lg space-y-1">
                                            <span className="text-[9px] text-[#991b1b] font-extrabold uppercase tracking-wide block select-none">
                                              Why might this fail / Officer Red Flags:
                                            </span>
                                            <p className="text-[10.5px] text-gray-700 leading-normal font-sans">
                                              {pair.failReason}
                                            </p>
                                          </div>
                                        </div>

                                        {pair.matchedKeywords && pair.matchedKeywords.length > 0 && (
                                          <div className="space-y-1.5 py-1">
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                                              Keyword Matches:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {pair.matchedKeywords.map((kw: string, kwid: number) => {
                                                const hasMatched = cleanedAns.includes(kw.toLowerCase());
                                                return (
                                                  <span 
                                                    key={kwid} 
                                                    className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wide select-none ${
                                                      hasMatched 
                                                        ? "bg-emerald-100 text-emerald-800" 
                                                        : "bg-red-100/70 text-red-800"
                                                    }`}
                                                  >
                                                    <span>{hasMatched ? "✓" : "×"}</span>
                                                    <span>{kw}</span>
                                                  </span>
                                                );
                                              })}
                                            </div>
                                            <p className="text-[9px] text-gray-400 leading-tight">
                                              Green indicators show keywords found in your answer.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="p-5 bg-amber-50/30 border-t border-amber-100">
                        <div className="space-y-2">
                          <label className="text-[10px] text-amber-800 font-extrabold uppercase tracking-widest flex items-center gap-1">
                            <span>📋</span>
                            <span>USCIS Officer Supervisor Case Notes</span>
                          </label>
                          <p className="text-[11px] text-gray-700 italic leading-relaxed border-l-2 border-amber-300 pl-3 select-text select-all">
                            {evaluationReport.officerNotes}
                          </p>
                          <div className="text-right pt-1">
                            <span className="text-[9px] text-gray-400 font-mono">CASE REGISTERED ID: {Date.now().toString().slice(-8)} (MOCK-REVIEW)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleResetSim}
                      className="flex-grow bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md cursor-pointer tracking-wider uppercase active:scale-95 transition-all"
                    >
                      Restart Sim Practice
                    </button>
                    <button
                      onClick={() => handleModeToggle("standard")}
                      className="flex-grow bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-extrabold py-3 rounded-xl text-xs cursor-pointer tracking-wider uppercase active:scale-95 transition-all"
                    >
                      Return to Study Mode
                    </button>
                  </div>
                </div>
              )}

              {/* Show spinner while AI thinks */}
              {loading && (
                <div className="flex gap-3 max-w-[80%] mr-auto text-left">
                  <div className="w-7 h-7 rounded-full bg-primary text-white shrink-0 flex items-center justify-center font-bold text-[10px] animate-pulse">
                    AI
                  </div>
                  <div className="bg-gray-50 border border-[#e5e7eb] rounded-lg rounded-tl-none p-3.5 text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                    <Loader className="w-3 h-3 animate-spin text-primary" />
                    <span>Enyi AI is preparing a response...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>


            <div className="p-4 bg-gray-50 shrink-0 space-y-3 px-5 border-t border-[#e5e7eb] flex flex-col justify-end">

              <div className="flex items-center gap-1.5 text-gray-400 font-medium text-[10px] select-none">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Suggested questions:</span>
              </div>


              <div className="flex gap-1.5 overflow-x-auto p-0.5 scrollbar-none">
                {activeSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendPrompt(suggestion)}
                    className="bg-white hover:bg-gray-100 border border-[#e5e7eb] text-gray-600 text-[10px] px-3 py-2 rounded-lg shrink-0 transition-all cursor-pointer select-none whitespace-nowrap active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {interruptedMessage && !inputText.trim() && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[#1e40af] text-[10px] font-bold leading-normal flex items-center justify-between gap-2 animate-fade-in select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 font-bold text-xs">🔊</span>
                    <span>Speech paused. Would you like to resume?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResumeSpeech}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1 transition-all active:scale-95 uppercase tracking-wider shrink-0"
                  >
                    <Play className="w-2 h-2 fill-white text-white" />
                    <span>Resume</span>
                  </button>
                </div>
              )}

              {speechError && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[#b45309] text-[10px] font-medium leading-normal flex items-start gap-2 animate-fade-in select-none">
                  <span className="shrink-0 mt-0.5 font-bold">⚠️</span>
                  <div className="flex-grow">
                    <span>{speechError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpeechError(null)}
                    className="text-amber-500 hover:text-amber-700 font-bold shrink-0 cursor-pointer px-1"
                  >
                    ×
                  </button>
                </div>
              )}


              <form onSubmit={handleFormSubmit} className="flex gap-2 w-full pt-1.5">
                <input
                  type="text"
                  value={inputText}
                  disabled={interviewState === "completed"}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? "Listening... Speak clearly and watch words type live! 🎙️"
                      : activeMode === "standard"
                      ? "Ask a study question about American history or civic terms..."
                      : "Answer the Officer's oral question..."
                  }
                  className={`flex-grow p-3 bg-white border rounded-xl text-xs outline-none focus:ring-1 transition-all h-11 ${
                    isListening
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50/10 placeholder-red-400 font-medium"
                      : "border-[#e5e7eb] focus:border-primary focus:ring-primary"
                  }`}
                />
                
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={interviewState === "completed"}
                  className={`h-11 w-11 rounded-xl border transition-all flex items-center justify-center shrink-0 shadow-sm cursor-pointer relative ${
                    isListening
                      ? "bg-red-500 border-red-500 text-white hover:bg-red-600 active:scale-95"
                      : "bg-[#f9fafb] border-[#e5e7eb] text-gray-500 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  title={isListening ? "Listening active - Click to stop recording" : "Talk instead of typing - Activate Speech to Text"}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-4 h-4 text-white animate-pulse" />
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                      </span>
                    </>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="submit"
                  disabled={!inputText.trim() || loading || interviewState === "completed"}
                  className="h-11 w-11 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-all flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

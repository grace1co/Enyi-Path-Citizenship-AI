export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string; // "A" | "B" | "C" | "D"
  explanation: string;
  category: string;
  dynamic?: boolean;
}

export interface Flashcard {
  id: number;
  topic: string;
  question: string;
  answer: string;
  category: string;
  isMastered: boolean;
}

export interface StudySession {
  id: string;
  date: string;
  module: string;
  score: number;
  totalQuestions: number;
  type: "Practice" | "Flashcards" | "Interview";
}

export interface ChatSource {
  text: string;
  similarity: number;
  chunk_id: number;
  document: string;
  url: string;
  source?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  sources?: ChatSource[];
}

export interface UserStats {
  masteredQuestionsCount: number; // out of 100
  activeStreak: number;
  lastQuizScore: number;
  totalTimeStudied: number; // in mins
  examDate: string;
  studyPoints: number; // accumulated points from study sessions
}

export interface StudyPlanItem {
  day: number;
  topic: string;
  category: string;
  tasks: string[];
  completed: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon identifier
  unlocked: boolean;
  unlockedAt?: string;
  color: string;
}

export interface InterviewHistoryItem {
  id: string;
  date: string;
  drillType: string;
  personality: string;
  score: number;
  outcome: string;
  untestedAreas?: string[];
  breakdown: {
    civics: number;
    fluency: number;
    confidence: number;
    n400: number;
    readiness: number;
    clarity: number;
  };
  whatWentWell: string[];
  areasToImprove: string[];
  pronunciationRisk?: {
    level: string;
    drillWords: string[];
  };
  n400Vulnerabilities?: string[];
  naturalness?: {
    score: number;
    rehearsedText: string;
    preferredText: string;
  };
  confidenceNotes?: string;
  officerNotes: string;
  followUpQuestions?: string[];
  qaPairsList?: {
    question: string;
    answer: string;
    notes?: string;
    category?: string;
    matchedKeywords?: string[];
    acceptedAnswer?: string;
    failReason?: string;
  }[];
}

export interface AppSettings {
  profileName: string;
  examDate: string;
  civicsVersion: "2008" | "2025";
  state: string;
  speechRate: "normal" | "slow" | "very-slow";
  explanationStyle: "normal" | "simple";
  explanationLanguage: string;
  interviewDifficulty: "practice" | "standard" | "strict";
  autoSaveProgress: boolean;
}

export interface QuestionProgress {
  [questionId: string]: {
    timesAnswered: number;
    timesWrong: number;
    lastAnswerCorrect: boolean | null;
    normalizedModule: string;
  };
}

export interface AnswerLogEntry {
  questionId: number;
  isCorrect: boolean;
  category: string;
  normalizedModule: string;
}

export function getDefaultSettings(user: any): AppSettings {
  return {
    profileName: user?.profile_name || "Student",
    examDate: "",
    civicsVersion: "2008",
    state: "Michigan",
    speechRate: "normal",
    explanationStyle: "normal",
    explanationLanguage: "English",
    interviewDifficulty: "standard",
    autoSaveProgress: true,
  };
}

export function safeLoadSettings(storageKey: string, user: any): AppSettings {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...getDefaultSettings(user),
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Failed to parse settings:", err);
  }
  return getDefaultSettings(user);
}



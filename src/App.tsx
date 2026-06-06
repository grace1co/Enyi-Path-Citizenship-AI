import React, { useState, useEffect } from "react";
import { Question, Flashcard, StudySession, ChatMessage, UserStats, AppSettings, getDefaultSettings, safeLoadSettings } from "./types";
import { uscisQuestions, uscisFlashcards } from "./data";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  BookOpen,
  Layers,
  Brain,
  BarChart2,
  Settings,
  HelpCircle,
  Menu,
  X,
  User,
  Activity,
  Award,
  Sparkles,
  Check,
  LogOut,
  Trash2,
  Mic
} from "lucide-react";

// Views
import HomeView from "./components/HomeView";
import PracticeView from "./components/PracticeView";
import FlashcardsView from "./components/FlashcardsView";
import TutorView from "./components/TutorView";
import ProgressView from "./components/ProgressView";
import ReadingWritingView from "./components/ReadingWritingView";
import EnyiLogo from "./components/EnyiLogo";
import AuthScreen from "./components/AuthScreen";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("enyi_auth_token"));
  const [user, setUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(!!token);

  const [activeView, setActiveView] = useState<"home" | "practice" | "flashcards" | "tutor" | "progress" | "reading_writing">("home");
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const initialToken = localStorage.getItem("enyi_auth_token");
    if (initialToken === "guest-token") {
      return safeLoadSettings("enyi_guest_settings", { id: "guest", profile_name: "Guest", isGuest: true });
    }
    const lastUserId = localStorage.getItem("enyi_last_user_id") || "guest";
    return safeLoadSettings(`enyi_user_settings_${lastUserId}`, { id: lastUserId });
  });

  const profileName = settings.profileName;
  const examDate = settings.examDate;
  const civicsVersion = settings.civicsVersion;

  const [stats, setStats] = useState<UserStats>({
    masteredQuestionsCount: 0,
    activeStreak: 1,
    lastQuizScore: 0,
    totalTimeStudied: 0,
    examDate: "",
    studyPoints: 0,
  });

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  useEffect(() => {
    localStorage.setItem("enyi_civics_version", civicsVersion);
    const loadCivicsData = async () => {
      try {
        let officials: any = null;
        try {
          const offRes = await fetch("/data/officials.json");
          if (offRes.ok) {
            officials = await offRes.json();
          }
        } catch (err) {
          console.warn("Could not load dynamic officials data, using defaults:", err);
        }

        const res = await fetch(`/data/civics-${civicsVersion}.json`);
        if (!res.ok) {
          throw new Error("Could not fetch civics JSON");
        }
        let data = await res.json();

        // Apply dynamic officials overrides if available
        if (officials) {
          data = data.map((q: any) => {
            if (!q.dynamic) return q;
            const updated = { ...q };
            if (q.id === 25 && officials.president) {
              const pres = officials.president.name;
              updated.options = [...q.options];
              updated.options[2] = pres; // "Donald Trump" position
              updated.explanation = officials.president.explanation;
              updated.acceptedAnswers = [pres, pres.toLowerCase()];
            } else if (q.id === 26 && officials.vicePresident) {
              const vp = officials.vicePresident.name;
              updated.options = [...q.options];
              updated.options[1] = vp; // "Kamala Harris" position
              updated.explanation = officials.vicePresident.explanation;
              updated.acceptedAnswers = [vp, vp.toLowerCase()];
            } else if (q.id === 37 && officials.chiefJustice) {
              const cj = officials.chiefJustice.name;
              updated.options = [...q.options];
              updated.options[1] = cj; // "John Roberts" position
              updated.explanation = officials.chiefJustice.explanation;
              updated.acceptedAnswers = [cj, cj.toLowerCase()];
            } else if (q.id === 41 && officials.president) {
              const party = officials.president.party;
              updated.options = [...q.options];
              updated.options[1] = party; // "Democratic Party" position
              updated.explanation = `President ${officials.president.name} belongs to the ${party}.`;
              updated.acceptedAnswers = [party, party.toLowerCase()];
            } else if (q.id === 42 && officials.speakerOfHouse) {
              const sp = officials.speakerOfHouse.name;
              updated.options = [...q.options];
              updated.options[2] = sp; // "Mike Johnson" position
              updated.explanation = officials.speakerOfHouse.explanation;
              updated.acceptedAnswers = [sp, sp.toLowerCase()];
            } else if (q.id === 100 && officials.governor) {
              const gov = officials.governor.name;
              updated.options = [...q.options];
              updated.options[2] = gov; // "The current Governor" position
              updated.explanation = officials.governor.explanation;
              updated.acceptedAnswers = [gov, gov.toLowerCase(), "the governor", "governor"];
            }
            return updated;
          });
        }

        setQuestions(data);

        const generated = data.map((q: any) => ({
          id: q.id,
          topic: q.category,
          question: q.question,
          answer: q.acceptedAnswers && q.acceptedAnswers.length > 0 ? q.acceptedAnswers[0] : q.options[0],
          category: q.category,
          isMastered: false
        }));

        if (token) {
          try {
            const fcRes = await fetch("/api/user/flashcards", {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (fcRes.ok) {
              const mKeys = await fcRes.json();
              setFlashcards(generated.map((card: any) => ({
                ...card,
                isMastered: mKeys[card.id] !== undefined ? mKeys[card.id] : false
              })));
              return;
            }
          } catch (err) {
            console.warn("Could not load flashcard mastery overlay:", err);
          }
        }
        setFlashcards(generated);
      } catch (err) {
        console.error("Failed to load dynamic questions, falling back:", err);
        let fallbackData = [...uscisQuestions];
        try {
          const offRes = await fetch("/data/officials.json");
          if (offRes.ok) {
            const officials = await offRes.json();
            fallbackData = fallbackData.map((q: any) => {
              if (!q.dynamic) return q;
              const updated = { ...q };
              if (q.id === 25 && officials.president) {
                const pres = officials.president.name;
                updated.options = [...q.options];
                updated.options[2] = pres;
                updated.explanation = officials.president.explanation;
                updated.acceptedAnswers = [pres, pres.toLowerCase()];
              } else if (q.id === 26 && officials.vicePresident) {
                const vp = officials.vicePresident.name;
                updated.options = [...q.options];
                updated.options[1] = vp;
                updated.explanation = officials.vicePresident.explanation;
                updated.acceptedAnswers = [vp, vp.toLowerCase()];
              } else if (q.id === 37 && officials.chiefJustice) {
                const cj = officials.chiefJustice.name;
                updated.options = [...q.options];
                updated.options[1] = cj;
                updated.explanation = officials.chiefJustice.explanation;
                updated.acceptedAnswers = [cj, cj.toLowerCase()];
              } else if (q.id === 41 && officials.president) {
                const party = officials.president.party;
                updated.options = [...q.options];
                updated.options[1] = party;
                updated.explanation = `President ${officials.president.name} belongs to the ${party}.`;
                updated.acceptedAnswers = [party, party.toLowerCase()];
              } else if (q.id === 42 && officials.speakerOfHouse) {
                const sp = officials.speakerOfHouse.name;
                updated.options = [...q.options];
                updated.options[2] = sp;
                updated.explanation = officials.speakerOfHouse.explanation;
                updated.acceptedAnswers = [sp, sp.toLowerCase()];
              } else if (q.id === 100 && officials.governor) {
                const gov = officials.governor.name;
                updated.options = [...q.options];
                updated.options[2] = gov;
                updated.explanation = officials.governor.explanation;
                updated.acceptedAnswers = [gov, gov.toLowerCase(), "the governor", "governor"];
              }
              return updated;
            });
          }
        } catch (e) {
          console.warn("Could not patch fallback questions:", e);
        }

        setQuestions(fallbackData);
        const generatedFallback = fallbackData.map((q: any) => ({
          id: q.id,
          topic: q.category,
          question: q.question,
          answer: q.correctAnswer ? q.options[q.correctAnswer.charCodeAt(0) - 65] : q.question,
          category: q.category,
          isMastered: false
        }));
        setFlashcards(generatedFallback);
      }
    };
    loadCivicsData();
  }, [civicsVersion, token]);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "welcome_init",
      role: "model",
      content: "Good morning, " + profileName + "! I am Enyi AI, your citizenship study partner. Ask me any question about American history, First Amendment rights, or government guidelines to get helpful simplifications.",
      timestamp: "10:00 AM",
    },
  ]);

  useEffect(() => {
    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    if (token === "guest-token") {
      const cachedUser = JSON.parse(localStorage.getItem("enyi_guest_user") || '{"id":"guest","profile_name":"Guest","isGuest":true}');
      const cachedStats = JSON.parse(localStorage.getItem("enyi_guest_stats") || "null") || {
        masteredQuestionsCount: 0,
        activeStreak: 1,
        lastQuizScore: 0,
        totalTimeStudied: 0,
        examDate: "",
        studyPoints: 0,
      };
      const cachedSessions = JSON.parse(localStorage.getItem("enyi_guest_sessions") || "[]");
      const cachedFlashcardMastered = JSON.parse(localStorage.getItem("enyi_guest_flashcards") || localStorage.getItem("enyi_guest_flashcard_mastered") || "{}");

      setUser(cachedUser);
      const guestSettings = safeLoadSettings("enyi_guest_settings", cachedUser);
      setSettings(guestSettings);
      setStats(cachedStats);
      setSessions(cachedSessions);
      setFlashcards(prev => prev.map(card => ({
        ...card,
        isMastered: !!cachedFlashcardMastered[card.id]
      })));
      setIsCheckingSession(false);
      return;
    }

    const checkSessionAndSync = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Expired session token");
        }

        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("enyi_last_user_id", data.user.id);

        const userSettingsKey = `enyi_user_settings_${data.user.id}`;
        const userSettings = safeLoadSettings(userSettingsKey, data.user);
        if (data.user.profile_name && !userSettings.profileName) {
          userSettings.profileName = data.user.profile_name;
        }
        if (data.user.exam_date && !userSettings.examDate) {
          userSettings.examDate = data.user.exam_date;
        }
        setSettings(userSettings);

        const userStatsKey = `enyi_user_stats_${data.user.id}`;
        const cachedUserStats = JSON.parse(localStorage.getItem(userStatsKey) || "null");
        if (cachedUserStats) {
          setStats(cachedUserStats);
        } else {
          setStats(data.stats);
          localStorage.setItem(userStatsKey, JSON.stringify(data.stats));
        }

        const userSessionsKey = `enyi_user_sessions_${data.user.id}`;
        const cachedUserSessions = JSON.parse(localStorage.getItem(userSessionsKey) || "null");
        if (cachedUserSessions) {
          setSessions(cachedUserSessions);
        } else {
          const sesRes = await fetch("/api/user/sessions", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (sesRes.ok) {
            const sesData = await sesRes.json();
            setSessions(sesData);
            localStorage.setItem(userSessionsKey, JSON.stringify(sesData));
          }
        }

        const userFlashcardsKey = `enyi_user_flashcards_${data.user.id}`;
        const cachedUserFlashcards = JSON.parse(localStorage.getItem(userFlashcardsKey) || "null");
        if (cachedUserFlashcards) {
          setFlashcards(prev => prev.map(card => ({
            ...card,
            isMastered: !!cachedUserFlashcards[card.id]
          })));
        } else {
          const fcRes = await fetch("/api/user/flashcards", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (fcRes.ok) {
            const mKeys = await fcRes.json();
            setFlashcards(prev => prev.map(card => ({
              ...card,
              isMastered: mKeys[card.id] !== undefined ? mKeys[card.id] : false
            })));
            const flMap: Record<number, boolean> = {};
            setFlashcards(prev => {
              prev.forEach(card => {
                if (card.isMastered) flMap[card.id] = true;
              });
              return prev;
            });
            localStorage.setItem(userFlashcardsKey, JSON.stringify(flMap));
          }
        }

      } catch (err) {
        console.warn("Authentication failed, logging out:", err);
        handleLogout();
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSessionAndSync();
  }, [token]);

  useEffect(() => {
    setStats((prev) => ({ ...prev, examDate }));
  }, [examDate]);

  useEffect(() => {
    setChatHistory((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[0].id === "welcome_init") {
        copy[0].content = `Greetings, ${profileName}! I am Enyi AI, your citizenship study partner. Ask me any question about American history, First Amendment rights, or government guidelines to get helpful simplifications.`;
      }
      return copy;
    });
  }, [profileName]);

  // Persist settings whenever they change
  useEffect(() => {
    if (!token) return;
    if (token === "guest-token") {
      localStorage.setItem("enyi_guest_settings", JSON.stringify(settings));
    } else if (user?.id) {
      localStorage.setItem(`enyi_user_settings_${user.id}`, JSON.stringify(settings));
      // TODO: Sync signed-in settings to PostgreSQL after settings API is added.
    }
  }, [settings, token, user]);

  const migrateGuestDataToAccount = async (userId: string | number) => {
    // Carry over guest progress after signup
    try {
      const guestSettingsStr = localStorage.getItem("enyi_guest_settings");
      const guestStatsStr = localStorage.getItem("enyi_guest_stats");
      const guestSessionsStr = localStorage.getItem("enyi_guest_sessions");
      const guestFlashcardsStr = localStorage.getItem("enyi_guest_flashcards") || localStorage.getItem("enyi_guest_flashcard_mastered");
      const guestInterviewsStr = localStorage.getItem("enyi_guest_interviews");

      // 1. Settings Merge
      let mergedSettings = getDefaultSettings({ id: userId });
      if (guestSettingsStr) {
        const parsedGuestSettings = JSON.parse(guestSettingsStr);
        mergedSettings = { ...mergedSettings, ...parsedGuestSettings };
      }
      const userSettingsKey = `enyi_user_settings_${userId}`;
      const existingUserSettingsStr = localStorage.getItem(userSettingsKey);
      if (existingUserSettingsStr) {
        const parsedUser = JSON.parse(existingUserSettingsStr);
        mergedSettings = { ...parsedUser, ...mergedSettings };
      }
      localStorage.setItem(userSettingsKey, JSON.stringify(mergedSettings));
      setSettings(mergedSettings);

      // 2. Stats Merge
      let mergedStats = {
        masteredQuestionsCount: 0,
        activeStreak: 1,
        lastQuizScore: 0,
        totalTimeStudied: 0,
        examDate: "",
        studyPoints: 0,
      };
      const existingUserStatsStr = localStorage.getItem(`enyi_user_stats_${userId}`);
      if (existingUserStatsStr) {
        mergedStats = JSON.parse(existingUserStatsStr);
      }
      if (guestStatsStr) {
        const guestStats = JSON.parse(guestStatsStr);
        mergedStats = {
          masteredQuestionsCount: Math.max(mergedStats.masteredQuestionsCount || 0, guestStats.masteredQuestionsCount || 0),
          activeStreak: Math.max(mergedStats.activeStreak || 1, guestStats.activeStreak || 1),
          lastQuizScore: Math.max(mergedStats.lastQuizScore || 0, guestStats.lastQuizScore || 0),
          totalTimeStudied: (mergedStats.totalTimeStudied || 0) + (guestStats.totalTimeStudied || 0),
          examDate: mergedStats.examDate || guestStats.examDate || "",
          studyPoints: (mergedStats.studyPoints || 0) + (guestStats.studyPoints || 0),
        };
      }
      localStorage.setItem(`enyi_user_stats_${userId}`, JSON.stringify(mergedStats));
      setStats(mergedStats);

      // 3. Sessions Merge
      let mergedSessions = [];
      const existingUserSessionsStr = localStorage.getItem(`enyi_user_sessions_${userId}`);
      if (existingUserSessionsStr) {
        mergedSessions = JSON.parse(existingUserSessionsStr);
      }
      if (guestSessionsStr) {
        const guestSessions = JSON.parse(guestSessionsStr);
        mergedSessions = [...guestSessions, ...mergedSessions];
      }
      localStorage.setItem(`enyi_user_sessions_${userId}`, JSON.stringify(mergedSessions));
      setSessions(mergedSessions);

      // 4. Flashcards Mastery Merge (For mastery levels, take the higher value)
      let mergedFlashcardsMastery: Record<string, boolean> = {};
      const existingFlashcardsStr = localStorage.getItem(`enyi_user_flashcards_${userId}`);
      if (existingFlashcardsStr) {
        mergedFlashcardsMastery = JSON.parse(existingFlashcardsStr);
      }
      if (guestFlashcardsStr) {
        const guestFlashcardsMastery = JSON.parse(guestFlashcardsStr);
        if (Array.isArray(guestFlashcardsMastery)) {
          guestFlashcardsMastery.forEach((card: any) => {
            if (card && card.id) {
              mergedFlashcardsMastery[card.id] = mergedFlashcardsMastery[card.id] || card.isMastered;
            }
          });
        } else {
          Object.entries(guestFlashcardsMastery).forEach(([key, val]) => {
            mergedFlashcardsMastery[key] = mergedFlashcardsMastery[key] || !!val;
          });
        }
      }
      localStorage.setItem(`enyi_user_flashcards_${userId}`, JSON.stringify(mergedFlashcardsMastery));
      setFlashcards(prev => prev.map(card => ({
        ...card,
        isMastered: !!mergedFlashcardsMastery[card.id]
      })));

      // 5. Interviews Merge
      let mergedInterviews = [];
      const existingInterviewsStr = localStorage.getItem(`enyi_user_interviews_${userId}`);
      if (existingInterviewsStr) {
        mergedInterviews = JSON.parse(existingInterviewsStr);
      }
      if (guestInterviewsStr) {
        const guestInterviews = JSON.parse(guestInterviewsStr);
        mergedInterviews = [...guestInterviews, ...mergedInterviews];
      }
      localStorage.setItem(`enyi_user_interviews_${userId}`, JSON.stringify(mergedInterviews));

      // PostgreSQL sync
      const activeToken = localStorage.getItem("enyi_auth_token");
      if (activeToken && activeToken !== "guest-token") {
        try {
          await fetch("/api/user/stats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${activeToken}`
            },
            body: JSON.stringify(mergedStats),
          });
        } catch (err) {
          console.warn("Failed to sync migrated stats:", err);
        }

        const guestSessionsList = guestSessionsStr ? JSON.parse(guestSessionsStr) : [];
        for (const session of guestSessionsList) {
          try {
            await fetch("/api/user/sessions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${activeToken}`
              },
              body: JSON.stringify(session)
            });
          } catch (err) {
            console.warn("Failed to sync migrated session:", err);
          }
        }

        if (guestFlashcardsStr) {
          const guestFlashcardsMastery = JSON.parse(guestFlashcardsStr);
          const entries = Array.isArray(guestFlashcardsMastery)
            ? guestFlashcardsMastery.map((card: any) => [card.id, card.isMastered])
            : Object.entries(guestFlashcardsMastery);

          for (const [id, isMast] of entries) {
            if (isMast) {
              try {
                await fetch(`/api/user/flashcards/${id}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${activeToken}`
                  },
                  body: JSON.stringify({ isMastered: true })
                });
              } catch (err) {
                console.warn("Failed to sync migrated flashcard:", id, err);
              }
            }
          }
        }
      }

      // Don't clear guest data until the sync succeeds
      localStorage.removeItem("enyi_guest_settings");
      localStorage.removeItem("enyi_guest_stats");
      localStorage.removeItem("enyi_guest_sessions");
      localStorage.removeItem("enyi_guest_flashcards");
      localStorage.removeItem("enyi_guest_flashcard_mastered");
      localStorage.removeItem("enyi_guest_interviews");
    } catch (err) {
      console.warn("Friction migrating guest data:", err);
    }
  };

  const handleAuthSuccess = (newToken: string, newUser: any, initialStats: any) => {
    localStorage.setItem("enyi_auth_token", newToken);
    setToken(newToken);
    setUser(newUser);

    if (newToken === "guest-token") {
      const cachedStats = JSON.parse(localStorage.getItem("enyi_guest_stats") || "null") || initialStats || {
        masteredQuestionsCount: 0,
        activeStreak: 1,
        lastQuizScore: 0,
        totalTimeStudied: 0,
        examDate: "",
        studyPoints: 0,
      };

      setStats(cachedStats);
      localStorage.setItem("enyi_guest_stats", JSON.stringify(cachedStats));
      localStorage.setItem("enyi_guest_user", JSON.stringify(newUser));

      const guestSettings = safeLoadSettings("enyi_guest_settings", newUser);
      setSettings(guestSettings);

      const cachedSessions = JSON.parse(localStorage.getItem("enyi_guest_sessions") || "[]");
      setSessions(cachedSessions);

      const cachedFlashcardMastered = JSON.parse(localStorage.getItem("enyi_guest_flashcards") || localStorage.getItem("enyi_guest_flashcard_mastered") || "{}");
      setFlashcards(prev => prev.map(card => ({
        ...card,
        isMastered: !!cachedFlashcardMastered[card.id]
      })));
    } else {
      localStorage.setItem("enyi_last_user_id", newUser.id);
      
      const guestHasProgress = localStorage.getItem("enyi_guest_stats") || localStorage.getItem("enyi_guest_sessions") || localStorage.getItem("enyi_guest_flashcards") || localStorage.getItem("enyi_guest_flashcard_mastered");
      if (guestHasProgress) {
        migrateGuestDataToAccount(newUser.id);
      } else {
        const userSettings = safeLoadSettings(`enyi_user_settings_${newUser.id}`, newUser);
        if (newUser.profile_name && !userSettings.profileName) {
          userSettings.profileName = newUser.profile_name;
        }
        if (newUser.exam_date && !userSettings.examDate) {
          userSettings.examDate = newUser.exam_date;
        }
        setSettings(userSettings);

        const cachedUserStats = JSON.parse(localStorage.getItem(`enyi_user_stats_${newUser.id}`) || "null");
        setStats(cachedUserStats || initialStats);

        const cachedUserSessions = JSON.parse(localStorage.getItem(`enyi_user_sessions_${newUser.id}`) || "[]");
        setSessions(cachedUserSessions);

        const cachedUserFlashcards = JSON.parse(localStorage.getItem(`enyi_user_flashcards_${newUser.id}`) || "{}");
        setFlashcards(prev => prev.map(card => ({
          ...card,
          isMastered: !!cachedUserFlashcards[card.id]
        })));
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("enyi_auth_token");
    localStorage.removeItem("enyi_guest_user");
    localStorage.removeItem("enyi_guest_settings");
    localStorage.removeItem("enyi_guest_stats");
    localStorage.removeItem("enyi_guest_sessions");
    localStorage.removeItem("enyi_guest_flashcards");
    localStorage.removeItem("enyi_guest_flashcard_mastered");
    localStorage.removeItem("enyi_guest_interviews");
    setToken(null);
    setUser(null);
    setSessions([]);
    setFlashcards(uscisFlashcards);
    setActiveView("home");
  };

  // Sync stats with the database
  const saveStatsToStateAndStorage = async (updatedStats: UserStats) => {
    setStats(updatedStats);
    if (!token) return;
    if (token === "guest-token") {
      localStorage.setItem("enyi_guest_stats", JSON.stringify(updatedStats));
      return;
    }
    try {
      await fetch("/api/user/stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedStats),
      });
    } catch (err) {
      console.warn("Failed to sync stats to database:", err);
    }
  };

  // Sync sessions with the database
  const saveSessionsToStateAndStorage = async (updatedSessions: StudySession[]) => {
    setSessions(updatedSessions);
    if (!token) return;
    if (token === "guest-token") {
      localStorage.setItem("enyi_guest_sessions", JSON.stringify(updatedSessions));
      return;
    }
    const newSession = updatedSessions[0];
    if (newSession) {
      try {
        await fetch("/api/user/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(newSession)
        });
      } catch (err) {
        console.warn("Failed to save session to relational DB:", err);
      }
    }
  };

  // Mark card as mastered in database
  const handleToggleMastery = async (id: number) => {
    if (id === 0) return;
    const currentCard = flashcards.find(c => c.id === id);
    if (!currentCard) return;

    const nextIsMastered = !currentCard.isMastered;

    const updated = flashcards.map((card) => {
      if (card.id === id) {
        return { ...card, isMastered: nextIsMastered };
      }
      return card;
    });
    setFlashcards(updated);

    if (token) {
      if (token === "guest-token") {
        const cachedFlashcardMastered = JSON.parse(localStorage.getItem("enyi_guest_flashcard_mastered") || "{}");
        cachedFlashcardMastered[id] = nextIsMastered;
        localStorage.setItem("enyi_guest_flashcard_mastered", JSON.stringify(cachedFlashcardMastered));
      } else {
        try {
          await fetch(`/api/user/flashcards/${id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ isMastered: nextIsMastered })
          });
        } catch (err) {
          console.warn("Failed to sync flashcard status:", err);
        }
      }
    }

    const toggledCard = updated.find((c) => c.id === id);
    const pointChange = toggledCard ? (toggledCard.isMastered ? 15 : -15) : 0;
    
    const masteredCount = updated.filter((c) => c.isMastered).length;
    const dynamicMasteredTotal = Math.min(100, 60 + masteredCount); 

    const newStats = {
      ...stats,
      masteredQuestionsCount: dynamicMasteredTotal,
      studyPoints: Math.max(0, stats.studyPoints + pointChange)
    };
    saveStatsToStateAndStorage(newStats);
  };

  // Save quiz results
  const handleCompleteQuiz = (score: number) => {
    const newSession: StudySession = {
      id: "ses_" + Date.now(),
      date: "Just Now",
      module: "Civics & Ethics Practice",
      score,
      totalQuestions: 10,
      type: "Practice",
    };
    const updatedSessions = [newSession, ...sessions];
    saveSessionsToStateAndStorage(updatedSessions);

    const addedMasteryRate = score >= 8 ? 2 : 1;
    const newMastered = Math.min(100, stats.masteredQuestionsCount + addedMasteryRate);
    const quizPoints = (score * 20) + (score >= 8 ? 50 : 0);

    const newStats: UserStats = {
      ...stats,
      lastQuizScore: score,
      masteredQuestionsCount: newMastered,
      totalTimeStudied: stats.totalTimeStudied + 15,
      activeStreak: stats.activeStreak + 1,
      studyPoints: stats.studyPoints + quizPoints
    };
    saveStatsToStateAndStorage(newStats);

    setActiveView("progress");
  };

  const handleAwardPoints = (points: number) => {
    const newStats: UserStats = {
      ...stats,
      studyPoints: stats.studyPoints + points,
      totalTimeStudied: stats.totalTimeStudied + 2
    };
    saveStatsToStateAndStorage(newStats);
  };

  const handleClearHistory = () => {
    setChatHistory([]);
  };

  const handleAddMessage = (msg: ChatMessage) => {
    setChatHistory((prev) => [...prev, msg]);
  };

  const handleResetMetrics = async () => {
    if (confirm("Are you sure you want to reset your practice metrics history?")) {
      const resetStats = {
        masteredQuestionsCount: 0,
        activeStreak: 1,
        lastQuizScore: 0,
        totalTimeStudied: 0,
        examDate,
        studyPoints: 0,
      };
      setStats(resetStats);
      setSessions([]);
      setFlashcards(uscisFlashcards);

      if (token) {
        if (token === "guest-token") {
          localStorage.setItem("enyi_guest_stats", JSON.stringify(resetStats));
          localStorage.setItem("enyi_guest_sessions", "[]");
          localStorage.setItem("enyi_guest_flashcard_mastered", "{}");
        } else {
          try {
            await fetch("/api/user/stats", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify(resetStats),
            });

            await fetch("/api/user/sessions/clear", {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` }
            });

            await fetch("/api/user/flashcards/reset", {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` }
            });
          } catch (err) {
            console.warn("Failed to reset history stats:", err);
          }
        }
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token && token !== "guest-token") {
      try {
        await fetch("/api/user/stats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ examDate: settings.examDate, profileName: settings.profileName })
        });
      } catch (err) {
        console.warn("Failed to save profile:", err);
      }
    }
    setShowSettings(false);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfcfd]">
        <div className="flex flex-col items-center space-y-4">
          <EnyiLogo size={48} className="animate-pulse" />
          <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="bg-[#fdfdfd] text-[#111827] font-sans min-h-screen flex antialiased">
      
      <nav id="sidebar-nav" className="hidden md:flex flex-col h-screen w-56 fixed left-0 top-0 z-50 bg-white border-r border-[#e5e7eb] py-6 shrink-0 justify-between select-none">
        <div className="space-y-6">
          <div className="px-6 flex items-center gap-2.5 mb-6">
            <EnyiLogo size={28} />
            <h1 className="font-bold text-lg text-[#1e3a8a] tracking-tight">
              Enyi Path
            </h1>
          </div>

          <div className="px-4">
            <button
              onClick={() => {
                setActiveView("practice");
                handleToggleMastery(0); // slight wake-state updates
              }}
              id="sidebar-cta-start-quiz"
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 hover:shadow active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Start Quiz</span>
            </button>
          </div>

          {token === "guest-token" && (
            <div className="mx-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col space-y-1.5 text-center shadow-xs animate-fade-in select-none">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase">GUEST STUDY MODE</span>
              </div>
              <p className="text-[10px] text-amber-700 leading-snug">Create an account to save your stats & streak permanently!</p>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1.5 px-2 rounded-lg text-[10px] select-none cursor-pointer transition-all active:scale-[0.98]"
              >
                Create Account
              </button>
            </div>
          )}

          <div className="space-y-1 px-3">
            {[
              { id: "home", label: "Dashboard", icon: Home },
              { id: "practice", label: "Study Mode", icon: BookOpen },
              { id: "flashcards", label: "Flashcards", icon: Layers },
              { id: "reading_writing", label: "Speech & Vocab", icon: Mic },
              { id: "tutor", label: "Enyi AI Tutor", icon: Brain },
              { id: "progress", label: "Progress Stats", icon: BarChart2 },
            ].map((item) => {
              const IconComp = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary-container text-primary font-medium"
                      : "text-[#6b7280] hover:bg-gray-50 hover:text-[#111827]"
                  }`}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-[#6b7280]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-3 space-y-1">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#6b7280] hover:bg-gray-50 hover:text-[#111827] cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#6b7280] shrink-0" />
            <span>{token === "guest-token" ? "Study Settings" : "Profile & Settings"}</span>
          </button>
          {token !== "guest-token" && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-red-500 shrink-0" />
              <span>Sign Out</span>
            </button>
          )}
          <a
            href="https://www.uscis.gov/citizenship"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#6b7280] hover:bg-gray-50 hover:text-[#111827]"
          >
            <HelpCircle className="w-4 h-4 text-[#6b7280] shrink-0" />
            <span>Official USCIS Help</span>
          </a>
        </div>
      </nav>

      <header id="mobile-top-bar" className="md:hidden flex justify-between items-center w-full px-5 h-14 z-40 bg-white border-b border-[#e5e7eb] fixed top-0 left-0 select-none">
        <div className="flex items-center gap-2.5">
          <EnyiLogo size={26} />
          <h1 className="font-bold text-md text-[#1e3a8a] tracking-tight">
            Enyi Path
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {token === "guest-token" && (
            <button
              onClick={handleLogout}
              className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold py-1 px-2.5 rounded-lg select-none cursor-pointer transition-all"
            >
              Sign Up
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="text-[#6b7280] hover:bg-gray-50 p-1.5 rounded-full transition-colors cursor-pointer select-none"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        <main className="flex-grow pt-20 md:pt-8 pb-24 md:pb-8 px-4 sm:px-6 md:px-10 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeView === "home" && (
                <HomeView
                  stats={stats}
                  recentSessions={sessions}
                  onChangeView={setActiveView}
                  onStartPractice={() => setActiveView("practice")}
                  profileName={profileName}
                  settings={settings}
                  setSettings={setSettings}
                />
              )}

              {activeView === "practice" && (
                <PracticeView
                  questions={questions}
                  onCompleteQuiz={handleCompleteQuiz}
                  onChangeView={setActiveView}
                  settings={settings}
                  setSettings={setSettings}
                />
              )}

              {activeView === "flashcards" && (
                <FlashcardsView
                  flashcards={flashcards}
                  onToggleMastery={handleToggleMastery}
                  settings={settings}
                  setSettings={setSettings}
                />
              )}

              {activeView === "tutor" && (
                <TutorView
                  chatHistory={chatHistory}
                  onAddMessage={handleAddMessage}
                  onClearHistory={handleClearHistory}
                  token={token}
                  settings={settings}
                  setSettings={setSettings}
                  onAddSession={(newSession) => {
                    const updated = [newSession, ...sessions];
                    saveSessionsToStateAndStorage(updated);
                    const nextStats = {
                      ...stats,
                      studyPoints: stats.studyPoints + 100,
                      totalTimeStudied: stats.totalTimeStudied + 20,
                    };
                    saveStatsToStateAndStorage(nextStats);
                  }}
                />
              )}

              {activeView === "progress" && (
                <ProgressView
                  stats={stats}
                  sessions={sessions}
                  onResetStats={handleResetMetrics}
                  onChangeView={setActiveView}
                  settings={settings}
                  setSettings={setSettings}
                />
              )}

              {activeView === "reading_writing" && (
                <ReadingWritingView
                  onAwardPoints={handleAwardPoints}
                  settings={settings}
                  setSettings={setSettings}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      // Mobile bottom navigation
      <nav id="mobile-bottom-nav" className="md:hidden fixed bottom-1.5 left-1.5 right-1.5 h-16 bg-[#eef3f7]/95 backdrop-blur-md border border-gray-100 rounded-2xl flex items-center justify-around px-2 py-1 select-none z-40 shadow-lg">
        {[
          { id: "home", label: "Home", icon: Home },
          { id: "practice", label: "Practice", icon: BookOpen },
          { id: "flashcards", label: "Cards", icon: Layers },
          { id: "reading_writing", label: "Speech", icon: Mic },
          { id: "tutor", label: "Tutor", icon: Brain },
          { id: "progress", label: "Progress", icon: BarChart2 },
        ].map((item) => {
          const IconComp = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`flex flex-col items-center justify-center shrink-0 w-14 h-12 transition-all cursor-pointer ${
                isActive
                  ? "text-primary font-extrabold pb-0.5 scale-105"
                  : "text-gray-400 hover:text-gray-900"
              }`}
            >
              <IconComp className={`w-5 h-5 ${isActive ? "text-primary fill-primary/10" : "text-gray-400"}`} />
              <span className={`text-[9px] font-semibold mt-1 ${isActive ? "font-bold text-primary" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end transition-opacity animate-fade-in">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between animate-slide-left overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                <h3 className="text-md font-extrabold text-[#1e3a8a] flex items-center gap-2 tracking-tight uppercase">
                  <Settings className="w-5 h-5 text-primary" />
                  <span>{token === "guest-token" ? "Study Settings" : "Profile & Study Settings"}</span>
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-900 p-1.5 hover:bg-gray-150 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guest Callout Banner */}
              {token === "guest-token" && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Guest Study Mode</span>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    You are studying as a Guest. Your progress is saved only to this device. Creating an account allows you to save progress across devices and keep long-term study history.
                  </p>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      handleLogout();
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    Create a Permanent Account
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* ACCOUNT SECTION (Only for Signed-in Users) */}
                {token !== "guest-token" && (
                  <div className="space-y-4 border-b border-gray-100 pb-5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Account Details</span>
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Your Profile Name:</label>
                      <input
                        type="text"
                        value={settings.profileName}
                        onChange={(e) => setSettings(prev => ({ ...prev, profileName: e.target.value }))}
                        required
                        placeholder="Enter name, e.g., Alex"
                        className="w-full p-2.5 border border-gray-200 rounded-xl font-sans text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">Civics Exam Date:</label>
                      <input
                        type="text"
                        value={settings.examDate}
                        onChange={(e) => setSettings(prev => ({ ...prev, examDate: e.target.value }))}
                        placeholder="e.g., Nov 12, 2026"
                        className="w-full p-2.5 border border-gray-200 rounded-xl font-sans text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50/50"
                      />
                    </div>
                  </div>
                )}

                {/* STUDY PREFERENCES SECTION */}
                <div className="space-y-4 border-b border-gray-100 pb-5">
                  <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-widest flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Study Preferences</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">Civics Test Question Bank:</label>
                    <select
                      value={settings.civicsVersion}
                      onChange={(e) => setSettings(prev => ({ ...prev, civicsVersion: e.target.value as "2008" | "2025" }))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-sans text-xs bg-[#f9fafb] cursor-pointer hover:bg-gray-50 outline-none"
                    >
                      <option value="2008">2008 Standard (100 Questions)</option>
                      <option value="2025">2025 Updated (128 Questions)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">State (for state-specific Q&As):</label>
                    <select
                      value={settings.state}
                      onChange={(e) => setSettings(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-sans text-xs bg-[#f9fafb] cursor-pointer hover:bg-gray-50 outline-none"
                    >
                      {["Michigan", "California", "Texas", "Florida", "New York", "Illinois", "Ohio", "Georgia", "North Carolina", "Pennsylvania", "Virginia", "Washington", "Arizona", "Massachusetts", "Colorado"].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">Explanation Style:</label>
                    <select
                      value={settings.explanationStyle}
                      onChange={(e) => setSettings(prev => ({ ...prev, explanationStyle: e.target.value as "normal" | "simple" }))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-sans text-xs bg-[#f9fafb] cursor-pointer hover:bg-gray-50 outline-none"
                    >
                      <option value="normal">Detailed / Thorough</option>
                      <option value="simple">Simple / Low Lexile Level</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">Explanation Language:</label>
                    <select
                      value={settings.explanationLanguage}
                      onChange={(e) => setSettings(prev => ({ ...prev, explanationLanguage: e.target.value }))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-sans text-xs bg-[#f9fafb] cursor-pointer hover:bg-gray-50 outline-none"
                    >
                      {["English", "Spanish", "Vietnamese", "Chinese", "Tagalog"].map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">Interview Difficulty:</label>
                    <select
                      value={settings.interviewDifficulty}
                      onChange={(e) => setSettings(prev => ({ ...prev, interviewDifficulty: e.target.value as "practice" | "standard" | "strict" }))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-sans text-xs bg-[#f9fafb] cursor-pointer hover:bg-gray-50 outline-none"
                    >
                      <option value="practice">Practice Mode (Helpful cues)</option>
                      <option value="standard">Standard Exam Mode</option>
                      <option value="strict">Strict Officer Mode</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="autosave-toggle"
                      type="checkbox"
                      checked={settings.autoSaveProgress}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoSaveProgress: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="autosave-toggle" className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider cursor-pointer">
                      Auto-save progress to device
                    </label>
                  </div>
                </div>

                {/* VOICE PREFERENCES SECTION */}
                <div className="space-y-4 border-b border-gray-100 pb-5">
                  <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-widest flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Preferences</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">Speech Talking Speed:</label>
                    <select
                      value={settings.speechRate}
                      onChange={(e) => setSettings(prev => ({ ...prev, speechRate: e.target.value as "normal" | "slow" | "very-slow" }))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-sans text-xs bg-[#f9fafb] cursor-pointer hover:bg-gray-50 outline-none"
                    >
                      <option value="normal">Normal Speed</option>
                      <option value="slow">Slow Speech Rate</option>
                      <option value="very-slow">Very Slow (High clarity)</option>
                    </select>
                  </div>
                </div>

                {/* PROGRESS/METRICS SECTION */}
                <div className="space-y-4 pt-1">
                  <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-widest flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Progress Control</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleResetMetrics}
                    className="w-full bg-gray-50 hover:bg-red-50 text-red-600 border border-red-200 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 uppercase tracking-wide"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Reset Practice Metrics</span>
                  </button>
                </div>

                {/* SUBMIT BUTTONS */}
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>{token === "guest-token" ? "Apply Settings" : "Save and Close"}</span>
                </button>
              </form>

              {/* OUT OF ACCOUNT ACTIONS */}
              {token !== "guest-token" && (
                <div className="pt-4 border-t border-gray-150 space-y-2">
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      handleLogout();
                    }}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] uppercase"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Sign Out of Account</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm("Are you absolutely sure you want to permanently delete your study account? This action can NEVER be undone.")) {
                        try {
                          const res = await fetch("/api/user", {
                            method: "DELETE",
                            headers: {
                              "Authorization": `Bearer ${token}`
                            }
                          });
                          if (!res.ok) {
                            throw new Error("Failed to delete user account.");
                          }
                          const data = await res.json();
                          alert(data.message || "Account deleted successfully.");
                          setShowSettings(false);
                          handleLogout();
                        } catch (err) {
                          console.error("Account delete error:", err);
                          alert("Could not complete account deletion. Please try again.");
                        }
                      }
                    }}
                    className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold py-3 rounded-xl text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] uppercase"
                  >
                    <Trash2 className="w-4.5 h-4.5 text-red-600 shrink-0" />
                    <span>Delete Study Account</span>
                  </button>
                </div>
              )}
            </div>

            <div className="text-center font-sans text-[10px] text-gray-400 border-t border-gray-50 pt-5 mt-6">
              Enyi Path © 2026 
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

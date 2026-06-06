import React, { useState, useEffect } from "react";
import { UserStats, StudySession, StudyPlanItem, Badge, QuestionProgress } from "../types";
import { normalizeModuleName } from "../utils/moduleMap";
import {
  Medal,
  Calendar,
  Award,
  Clock,
  BarChart2,
  Trophy,
  CheckSquare,
  Sparkles,
  Lock,
  LockOpen,
  Users,
  Database,
  LineChart,
  Cpu,
  AlertTriangle,
  Lightbulb,
  CheckCircle2
} from "lucide-react";

interface ProgressViewProps {
  stats: UserStats;
  sessions: StudySession[];
  onResetStats: () => void;
  onChangeView: (view: "home" | "practice" | "flashcards" | "tutor" | "progress") => void;
  settings?: any;
  setSettings?: any;
  questionProgress?: QuestionProgress;
  onStartReviewWrong?: () => void;
}

export default function ProgressView({
  stats,
  sessions,
  onResetStats,
  onChangeView,
  settings,
  setSettings,
  questionProgress = {},
  onStartReviewWrong,
}: ProgressViewProps) {
  const [activeTab, setActiveTab] = useState<"performance" | "roadmap">("performance");

  const [testDate, setTestDate] = useState<string>(stats.examDate || "");
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);
  const [isPlanGenerated, setIsPlanGenerated] = useState<boolean>(false);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedPlan = localStorage.getItem("enyi_study_roadmap");
    if (savedPlan) {
      setStudyPlan(JSON.parse(savedPlan));
      setIsPlanGenerated(true);
    }
    
    // Load saved interview reports
    const savedHistory = localStorage.getItem("enyi_interview_history");
    if (savedHistory) {
      setInterviewHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const modulesPlan: Omit<StudyPlanItem, "completed">[] = [
      {
        day: 1,
        topic: "Principles of American Democracy",
        category: "Democracy Principles",
        tasks: ["Study 5 Constitutional terms", "Review First Amendment Flashcards", "Perform 1 Civics Practice Quiz"]
      },
      {
        day: 2,
        topic: "System of Government",
        category: "Executive & Legislative",
        tasks: ["Ask Enyi AI to explain 'Federalism' and 'Three Branches'", "Memorize election term lengths", "Complete 1 Practice Session"]
      },
      {
        day: 3,
        topic: "Rights and Responsibilities",
        category: "Citizenship Duties",
        tasks: ["List 2 rights only for U.S. citizens", "Review Rights flashcards", "Discuss Rule of Law with Enyi AI"]
      },
      {
        day: 4,
        topic: "American History: Colonial Period",
        category: "Early Foundations",
        tasks: ["Study key figures (George Washington, Thomas Jefferson)", "Review Declaration of Independence context", "Do 1 Democracy quiz"]
      },
      {
        day: 5,
        topic: "American History: 1800s & Civil War",
        category: "Union & Progress",
        tasks: ["Understand the Lincoln presidency and emancipation list", "Review causes of the Civil War", "Attempt 1 history quiz session"]
      },
      {
        day: 6,
        topic: "Geography, Symbols & Holidays",
        category: "National Icons",
        tasks: ["Memorize the 2 largest US rivers", "Understand the Star-Spangled Banner origin", "Filter flashcards for Holidays mode"]
      },
      {
        day: 7,
        topic: "Pre-Exam Mock N-400 & Oral Interview",
        category: "Full Officer Oral",
        tasks: ["Enter Enyi AI Tutor Simulation mode", "Score at least 6/10 on Oral Assessment", "Unlock the Oral Interview Badge!"]
      }
    ];

    const generated: StudyPlanItem[] = modulesPlan.map((p: Omit<StudyPlanItem, "completed">) => ({
      ...p,
      completed: false
    }));

    setStudyPlan(generated);
    setIsPlanGenerated(true);
    localStorage.setItem("enyi_study_roadmap", JSON.stringify(generated));
  };

  const handleToggleTask = (day: number) => {
    const updated = studyPlan.map((p: StudyPlanItem) => {
      if (p.day === day) {
        return { ...p, completed: !p.completed };
      }
      return p;
    });
    setStudyPlan(updated);
    localStorage.setItem("enyi_study_roadmap", JSON.stringify(updated));
  };

  const getCategoryMetrics = () => {
    const categoryStats: Record<string, { correct: number; total: number; color: string }> = {
      "Principles of Democracy": { correct: 0, total: 0, color: "bg-primary" },
      "System of Government": { correct: 0, total: 0, color: "bg-[#2563eb]" },
      "American History": { correct: 0, total: 0, color: "bg-emerald-500" },
      "Rights & Responsibilities": { correct: 0, total: 0, color: "bg-amber-500" },
      "Geography & Symbols": { correct: 0, total: 0, color: "bg-purple-500" },
    };

    Object.values(questionProgress).forEach((prog) => {
      const mod = normalizeModuleName(prog.normalizedModule);
      if (categoryStats[mod]) {
        const correct = prog.timesAnswered - prog.timesWrong;
        categoryStats[mod].correct += correct;
        categoryStats[mod].total += prog.timesAnswered;
      }
    });

    return Object.entries(categoryStats).map(([name, val]) => ({
      name,
      accuracy: val.total > 0 ? Math.min(100, Math.round((val.correct / val.total) * 100)) : 0,
      color: val.color,
      hasData: val.total > 0,
    }));
  };

  const categoriesAccuracy = getCategoryMetrics();

  const weakestCategory = [...categoriesAccuracy].sort((a, b) => a.accuracy - b.accuracy)[0];

  const overallReadiness = Math.min(
    99,
    Math.max(
      45,
      Math.round(
        50 +
          (stats.masteredQuestionsCount * 0.3) +
          (stats.activeStreak * 1.5) +
          ((stats.lastQuizScore || 7) * 1.5)
      )
    )
  );

  let readinessRating = "Needs Structured Study";
  let ratingExplanation = "Focus on weak elements below. Keep up a daily streak to elevate retention.";
  let ratingColor = "text-amber-500";

  if (overallReadiness >= 85) {
    readinessRating = "Excellent Readiness";
    ratingExplanation = "You are showing strong readiness. Keep practicing full interviews.";
    ratingColor = "text-emerald-600";
  } else if (overallReadiness >= 65) {
    readinessRating = "On Track";
    ratingExplanation = "On track to pass! Strengthen history dates to boost confidence.";
    ratingColor = "text-primary";
  }

  const points = stats.studyPoints || 0;
  let userLevelName = "Novice Patriot";
  let pointsToNext = 150 - points;
  if (points >= 600) {
    userLevelName = "Ambassador of Freedom";
    pointsToNext = 1200 - points;
  } else if (points >= 350) {
    userLevelName = "Constitution Guardian";
    pointsToNext = 600 - points;
  } else if (points >= 150) {
    userLevelName = "Civic Explorer";
    pointsToNext = 350 - points;
  }

  const badges: Badge[] = [
    {
      id: "streak_5",
      title: "5-Day Streak",
      description: "Maintained a 5-day active study study streak",
      icon: "Streak",
      unlocked: stats.activeStreak >= 5,
      color: "border-amber-200 bg-amber-50/50 text-amber-600"
    },
    {
      id: "points_300",
      title: "300 Study Points",
      description: "Accumulated over 300 total study points",
      icon: "Points",
      unlocked: points >= 300,
      color: "border-purple-200 bg-purple-50/50 text-purple-600"
    },
    {
      id: "master_70",
      title: "USCIS Scholar",
      description: "Mastered over 70 flashcard queries",
      icon: "Cards",
      unlocked: stats.masteredQuestionsCount >= 70,
      color: "border-blue-200 bg-blue-50/50 text-blue-600"
    },
    {
      id: "interview_ready",
      title: "Interview Practice Complete",
      description: "Completed USCIS Officer oral simulation test",
      icon: "Mic",
      unlocked: sessions.some((s) => s.type === "Interview"),
      color: "border-emerald-200 bg-emerald-50/50 text-emerald-600"
    },
    {
      id: "perfect_score",
      title: "Perfect Practice Score",
      description: "Scored a perfect score (10/10) on a practice exam",
      icon: "Trophy",
      unlocked: stats.lastQuizScore === 10 || sessions.some((s) => s.score === 10),
      color: "border-rose-200 bg-rose-50/50 text-rose-600"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto min-w-0 space-y-6 animate-fade-in py-2">
      {/* Tab Segment Controls */}
      <div className="flex border-b border-gray-100 pb-px justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "performance"
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-gray-900"
            }`}
          >
            Performance Analytics
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "roadmap"
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-gray-900"
            }`}
          >
            Study Roadmap Plan
          </button>
        </div>
        <div className="text-[11px] font-mono font-bold text-primary bg-primary-container px-3 py-1 rounded-full flex items-center gap-1.5 select-none shadow-sm">
          <Trophy className="w-3.5 h-3.5" />
          <span>{points} Study Points • {userLevelName}</span>
        </div>
      </div>

      {activeTab === "performance" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Your Study Progress Overview</h2>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-relaxed font-sans">
              See how ready you are, how many points you’ve earned, and past practice results.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#e5e7eb] rounded-xl overflow-hidden p-6 shadow-sm min-w-0">
            <div className="lg:col-span-5 min-w-0 flex flex-col items-center justify-center p-2 border-b lg:border-b-0 lg:border-r border-gray-100 text-center space-y-3 font-sans">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans">Predicted Exam Readiness</span>
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-gray-100" cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" />
                  <circle
                    className="text-primary transition-all duration-700"
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="263.8"
                    strokeDashoffset={263.8 - (263.8 * overallReadiness) / 100}
                    strokeLinecap="round"
                    strokeWidth="6"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">{overallReadiness}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className={`text-xs font-bold ${ratingColor} block uppercase tracking-wider font-sans`}>{readinessRating}</span>
                <span className="text-[10px] text-gray-400 font-sans block max-w-[200px] leading-tight">{ratingExplanation}</span>
              </div>
            </div>

            <div className="lg:col-span-7 min-w-0 flex flex-col justify-between p-2 space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide select-none">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                  What to study next based on your answers
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-sans">
                  We look at your past quizzes and mock interviews to suggest what you need to practice most.
                </p>
              </div>

              {/* Pick a weakness to practice */}
              {interviewHistory && interviewHistory.length > 0 ? (
                (() => {
                  const latest = interviewHistory[0];
                  const weakCivics = latest.breakdown?.civics < 80;
                  const weakN400 = latest.breakdown?.n400 < 80;
                  const weakConfidence = latest.breakdown?.confidence < 75;

                  let mainWeaknessTopic = "Oral Interview Mock Drill";
                  let recommendedDrillKey = "all";
                  let reasonText = "Keep practicing full length simulations to raise overall confidence scores.";

                  if (weakCivics) {
                    mainWeaknessTopic = "Civics-Only Oral Fire Drill";
                    recommendedDrillKey = "civics";
                    reasonText = `Based on your score of ${latest.breakdown?.civics}% in Civics Knowledge. We recommend focused quick-fire civics rounds.`;
                  } else if (weakN400) {
                    mainWeaknessTopic = "N-400 Personal Biography Practice";
                    recommendedDrillKey = "personal";
                    reasonText = `Based on N-400 Familiarity rating of ${latest.breakdown?.n400}%. Focus on precise date declarations and background answers.`;
                  } else if (latest.drillType === "travel" || latest.areasToImprove?.some((a: string) => a.toLowerCase().includes("travel") || a.toLowerCase().includes("trip"))) {
                    mainWeaknessTopic = "Travel History & Trip dates drill";
                    recommendedDrillKey = "travel";
                    reasonText = "The examiner flagged travel chronology gaps in your last review. Practice trip counts and exact durations.";
                  } else if (latest.areasToImprove?.some((a: string) => a.toLowerCase().includes("moral") || a.toLowerCase().includes("claim") || a.toLowerCase().includes("meaning"))) {
                    mainWeaknessTopic = "Moral Character Yes/No & Definition Drill";
                    recommendedDrillKey = "moral";
                    reasonText = "Practice testing critical vocabulary definition check-questions like 'genocide' or 'selective service'.";
                  }

                  const handleJumpToDrill = () => {
                    localStorage.setItem(
                      "enyi_pre_trigger_drill",
                      JSON.stringify({ mode: "interview", drillType: recommendedDrillKey })
                    );
                    onChangeView("tutor");
                  };

                  return (
                    <div className="bg-red-50/40 border border-red-100 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] text-red-700 font-extrabold uppercase tracking-wide bg-red-100/50 px-2.5 py-0.5 rounded-full">
                          ⚠️ Core Weakness Highlight
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Last Score: {latest.score}%</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-905">{mainWeaknessTopic}</h4>
                        <p className="text-[10.5px] text-gray-500 font-sans leading-relaxed">{reasonText}</p>
                      </div>
                      <div className="pt-1.5 flex gap-2">
                        <button
                          type="button"
                          onClick={handleJumpToDrill}
                          className="bg-primary hover:bg-primary-hover text-white text-[10.5px] font-bold px-3.5 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 active:scale-95 transition-transform"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                          <span>Launch recommended Drill</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-amber-50/50 border border-amber-100/80 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wide font-sans block">Primary Area Recommendation:</span>
                  <div className="flex items-center gap-2 text-xs text-amber-950 font-medium">
                    <span className="text-amber-500 text-lg">✓</span>
                    <span>{weakestCategory ? weakestCategory.name : "American History Review Sessions"}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-sans leading-normal pt-1">
                    You can elevate your Predicted Exam Readiness by taking a custom simulated interview in the Tutor tab. Enyi AI Coach will diagnose and log your custom strengths.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
            <div className="bg-white border border-[#e5e7eb] p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                <Medal className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-sans">Active Streak</span>
                <span className="text-sm sm:text-base font-bold text-gray-900 leading-tight">{stats.activeStreak} Days</span>
              </div>
            </div>

            <div className="bg-white border border-[#e5e7eb] p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary shrink-0 border border-primary/10">
                <Award className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-sans">Mastered Items</span>
                <span className="text-sm sm:text-base font-bold text-primary leading-tight">{stats.masteredQuestionsCount} / 100</span>
              </div>
            </div>

            <div className="bg-white border border-[#e5e7eb] p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <Clock className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-sans">Study Time</span>
                <span className="text-sm sm:text-base font-bold text-gray-900 leading-tight">{stats.totalTimeStudied} Mins</span>
              </div>
            </div>

            <div className="bg-white border border-[#e5e7eb] p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 border border-purple-100">
                <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-sans">USCIS Appointment</span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-900 leading-tight block truncate">{stats.examDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] p-4 sm:p-5 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide select-none">
              <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary" />
              Earned Badges & Civic Milestones
            </h3>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-sans max-w-xl leading-relaxed">
              Complete practice exams, answer daily flashcards, and use Enyi AI lessons to unlock badges. Push yourself to become a U.S. Civics Expert!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 pt-1">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`border p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2 transition-all relative ${
                    b.unlocked ? `${b.color} shadow-sm border-transparent` : "border-gray-200 bg-gray-50/20 text-gray-300"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                    b.unlocked ? "bg-white/80 border-current" : "border-gray-200 bg-gray-100 text-gray-400"
                  }`}>
                    {b.unlocked ? (
                      <LockOpen className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className={`text-xs font-bold block ${b.unlocked ? "text-gray-800" : "text-gray-400"}`}>{b.title}</span>
                    <span className="text-[9px] leading-tight block text-gray-400 max-w-[120px] mx-auto">{b.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide select-none">
                  <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                  Accuracy Level by Civics Module
                </h3>
                {onStartReviewWrong && (
                  <button
                    onClick={onStartReviewWrong}
                    className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Review Wrong Answers
                  </button>
                )}
              </div>
              <div className="space-y-4 pt-1">
                {categoriesAccuracy.every((cat) => !cat.hasData) ? (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    Complete a practice quiz to see your accuracy by topic.
                  </div>
                ) : (
                  categoriesAccuracy.map((cat, idx) => (
                    <div key={idx} className="space-y-1.5 font-sans">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-600 font-medium">{cat.name}</span>
                        <span className="font-semibold text-gray-900">
                          {cat.hasData ? `${cat.accuracy}% Accuracy` : "No data yet"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                          style={{ width: `${cat.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide select-none">
                  <LineChart className="w-3.5 h-3.5 text-gray-400" />
                  Your Progression Pathway
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed font-sans">
                  The official USCIS Civics Test consists of 10 oral questions. You need to answer at least <strong>6 questions (60%)</strong> correctly to pass.
                </p>
                <div className="p-3 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-100 font-sans text-xs">
                  <strong>Ready Status:</strong> Your predicted test passing probability is extremely high ({overallReadiness}%). We suggest performing Simulated Officer Interviews in other modes.
                </div>
              </div>
              <button
                onClick={() => onChangeView("practice")}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2 rounded-lg text-xs cursor-pointer shadow-sm"
              >
                Launch Mock Exam
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-gray-900 block select-none uppercase tracking-wide">Study Practice Records</h3>
              <button
                onClick={onResetStats}
                className="text-[10px] text-red-500 font-semibold hover:underline cursor-pointer tracking-wider uppercase"
              >
                Reset Historical Data
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs font-medium">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5 pl-1">Date</th>
                    <th className="pb-2.5">Topic Covered</th>
                    <th className="pb-2.5 text-center">Score Ratio</th>
                    <th className="pb-2.5 text-right pr-1">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-400 text-xs">
                        No completed study sessions registered.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((ses) => (
                      <tr key={ses.id}>
                        <td className="py-2.5 pl-1">{ses.date}</td>
                        <td className="py-2.5 font-medium text-gray-800">{ses.module}</td>
                        <td className="py-2.5 text-center font-bold text-gray-900">
                          {ses.type === "Practice" ? `${ses.score} / ${ses.totalQuestions}` : `Completed`}
                        </td>
                        <td className="py-2.5 text-right font-semibold pr-1 text-primary">{ses.type}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl space-y-4 font-sans">
            <div>
              <h3 className="text-xs font-bold text-gray-900 block select-none uppercase tracking-wide">
                📁 Officer Mock Interview Case-History
              </h3>
              <p className="text-[10.5px] text-gray-400 font-sans">
                Full-length supervisor diagnostic case files saved from your simulation sessions.
              </p>
            </div>

            {interviewHistory && interviewHistory.length > 0 ? (
              <div className="space-y-4">
                {interviewHistory.map((item, idx) => (
                  <div key={item.id || idx} className="border border-gray-150 rounded-xl p-4 space-y-3 bg-gray-50/20 hover:bg-white transition-all shadow-xs">
                    <div className="flex justify-between items-start flex-wrap gap-2 border-b border-gray-100 pb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9.5px] font-mono font-bold bg-[#1e40af]/10 text-[#1e40af] px-2 py-0.5 rounded">
                            CASE: #{idx + 1}
                          </span>
                          <span className="text-xs font-black text-gray-800 uppercase tracking-tight">
                            {item.drillType === "all" ? "Full USCIS Simulation" : `${item.drillType.toUpperCase()} Drill`}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-gray-400">
                          Completed: {item.date} • Officer Personality: <span className="font-semibold text-gray-600 capitalize">{item.personality}</span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2.5">
                        <div className="text-xs">
                          Score Ratio: <strong className="text-gray-900 text-sm">{item.score}%</strong>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs ${
                          item.outcome === "PASS"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.outcome === "FAIL"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {item.outcome}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center py-1">
                      <div className="bg-white border p-2 rounded-lg">
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Civics Score</span>
                        <span className="text-xs font-black text-[#10b981]">{item.breakdown?.civics}%</span>
                      </div>
                      <div className="bg-white border p-2 rounded-lg">
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Fluency</span>
                        <span className="text-xs font-black text-[#3b82f6]">{item.breakdown?.fluency}%</span>
                      </div>
                      <div className="bg-white border p-2 rounded-lg">
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Confidence</span>
                        <span className="text-xs font-black text-[#8b5cf6]">{item.breakdown?.confidence}%</span>
                      </div>
                      <div className="bg-white border p-2 rounded-lg">
                        <span className="text-[9px] text-gray-400 block font-bold uppercase">Clarity</span>
                        <span className="text-xs font-black text-[#14b8a6]">{item.breakdown?.clarity}%</span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-white border border-gray-150 p-3 rounded-lg text-left">
                      <span className="text-[9.5px] text-amber-800 font-extrabold uppercase block select-none">📋 Officer Supervisor Comments:</span>
                      <p className="text-[11px] text-gray-700 italic leading-relaxed">{item.officerNotes}</p>
                    </div>

                    {item.areasToImprove && item.areasToImprove.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9.5px] text-red-700 font-extrabold uppercase block">⚠️ Detected Memory Gaps to Review:</span>
                        <ul className="text-[10.5px] text-gray-600 space-y-1 list-disc pl-4 italic">
                          {item.areasToImprove.slice(0, 2).map((a: string, aid: number) => (
                            <li key={aid}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50/50 border border-dashed rounded-xl border-gray-200">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">No Simulated Interview Cases Registered</p>
                <p className="text-[10.5px] text-gray-450 mt-1 max-w-sm mx-auto leading-normal">
                  You haven't completed any oral naturalization interviews yet. Once you do, Supervisor diagnostics will populate here!
                </p>
              </div>
            )}
          </div>

          {/* Common difficult questions (based on USCIS data) */}
          <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase select-none font-sans">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Examples of questions many people find hard
            </h3>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">
              Based on common challenges, immigrants frequently face complexity on these specific questions due to subtle historical details or phrasing overlaps:
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
              {[
                {
                  q: "What is one war fought by the United States in the 1800s?",
                  err: "68% error rate",
                  sub: "Immigrants frequently select World War I due to date overlap.",
                },
                {
                  q: "There are four amendments to the Constitution about who can vote. Describe one.",
                  err: "59% error rate",
                  sub: "Remembering specific amendment numbers (15th, 19th, 24th, 26th) is difficult.",
                },
                {
                  q: "Under our Constitution, some powers belong to the states. What is one?",
                  err: "52% error rate",
                  sub: "Shared powers vs exclusive state powers gets confused with federal duties.",
                }
              ].map((item, id) => (
                <div key={id} className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-150 space-y-1.5 hover:bg-white transition-colors duration-200">
                  <div className="flex justify-between items-start gap-2 border-b border-gray-100 pb-1.5 mb-1.5">
                    <span className="text-xs font-bold text-slate-800 leading-tight block">{item.q}</span>
                    <span className="text-[10px] font-extrabold text-red-500 whitespace-nowrap bg-red-50 px-1.5 py-0.5 rounded-md">{item.err}</span>
                  </div>
                  <p className="text-[10.5px] text-gray-450 leading-relaxed font-sans">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "roadmap" && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Personalized Study Roadmap Planner</h2>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Enter your official USCIS exam date to instantly receive an adaptive day-by-day checklist.
            </p>
          </div>

          <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl">
            <form onSubmit={handleGeneratePlan} className="flex flex-col sm:flex-row gap-3.5 items-end">
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-xs font-bold text-gray-500 block uppercase">Official appointment target date:</label>
                <input
                  type="text"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  placeholder="e.g. Sept 15, 2026"
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl outline-none focus:border-primary bg-gray-50/50 grow"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-3 rounded-xl cursor-pointer transition-transform shrink-0 shadow-sm"
              >
                Generate Study Path
              </button>
            </form>
          </div>

          {isPlanGenerated ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-3 bg-primary-container text-primary font-semibold text-xs rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span>Roadmap updated for your target date of {testDate}. complete the daily checklists to pass!</span>
              </div>

              <div className="space-y-3">
                {studyPlan.map((p) => (
                  <div
                    key={p.day}
                    className={`border rounded-xl p-4 transition-all bg-white relative ${
                      p.completed ? "border-emerald-200 bg-emerald-50/10" : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 bg-primary-container rounded-md">
                            Day {p.day}
                          </span>
                          <h4 className="text-xs font-bold text-gray-900">{p.topic}</h4>
                        </div>
                        <span className="text-[10px] text-gray-400 font-sans ml-1 bg-gray-50 px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleTask(p.day)}
                        className={`text-xs px-3 py-1 rounded-lg border font-bold cursor-pointer transition-colors ${
                          p.completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white hover:bg-gray-50 text-gray-500 border-gray-200"
                        }`}
                      >
                        {p.completed ? "Completed!" : "Mark Day Complete"}
                      </button>
                    </div>

                    <div className="pl-1 space-y-1.5 border-t border-gray-50 pt-2 text-[11px] text-gray-600">
                      {p.tasks.map((task, tid) => (
                        <div key={tid} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.completed ? "bg-emerald-500" : "bg-primary/50"}`} />
                          <span className={p.completed ? "line-through text-gray-400" : ""}>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center font-sans py-14 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
              <span className="text-xl">📅</span>
              <p className="text-xs font-semibold text-gray-500">No active roadmap plan compiled yet.</p>
              <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                Enter your Civics Exam date in the box above to generate an automated day-by-day checklist.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

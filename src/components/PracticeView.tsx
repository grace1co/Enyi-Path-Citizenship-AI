import React, { useState } from "react";
import { Question } from "../types";
import {
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Award,
  BookOpen,
  Shuffle,
  Compass,
  Check,
  ChevronDown,
  Globe,
  Home,
  Volume2
} from "lucide-react";
import { speakText, stopSpeaking } from "../utils/speech";

interface PracticeViewProps {
  questions: Question[];
  onCompleteQuiz: (score: number) => void;
  onChangeView: (view: "home" | "practice" | "flashcards" | "tutor" | "progress") => void;
  settings?: any;
  setSettings?: any;
}

export default function PracticeView({
  questions,
  onCompleteQuiz,
  onChangeView,
  settings,
  setSettings,
}: PracticeViewProps) {
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

  React.useEffect(() => {
    if (questions && questions.length > 0) {
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      setActiveQuestions(shuffled.slice(0, 10));
    }
  }, [questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [categoryPerformance, setCategoryPerformance] = useState<Record<string, { correct: number; total: number }>>({});

  const [isSpeaking, setIsSpeaking] = useState(false);

  React.useEffect(() => {
    setIsSpeaking(false);
    stopSpeaking();
  }, [currentIndex]);

  React.useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const explanationStyle = settings?.explanationStyle || "normal";
  const explanationLanguage = settings?.explanationLanguage || "English";
  
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const [showFeedbackSummary, setShowFeedbackSummary] = useState(false);

  if (activeQuestions.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-white border border-[#e5e7eb] rounded-xl shadow-sm text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Preparing Practice Quiz...</p>
      </div>
    );
  }

  const currentQuestion = activeQuestions[currentIndex];
  const queryPrefixes = ["A", "B", "C", "D"];

  const handleSelectOption = (prefix: string) => {
    if (isChecked) return;
    setSelectedOption(prefix);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setIsChecked(true);
    const correct = selectedOption === currentQuestion.correctAnswer;
    if (correct) {
      setScore((prev) => prev + 1);
    }

    const cat = currentQuestion.category || "General Civics";
    setCategoryPerformance((prev) => {
      const currentVal = prev[cat] || { correct: 0, total: 0 };
      return {
        ...prev,
        [cat]: {
          correct: currentVal.correct + (correct ? 1 : 0),
          total: currentVal.total + 1,
        },
      };
    });
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsChecked(false);
    setAiTip(null);

    if (currentIndex + 1 >= activeQuestions.length) {
      setShowFeedbackSummary(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAskEnyiAI = async (styleOption?: "normal" | "simple", langOption?: string) => {
    setLoadingAi(true);
    const activeStyle = styleOption || explanationStyle;
    const activeLang = langOption || explanationLanguage;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              id: "quiz_prompt",
              role: "user",
              content: `Explain the citizenship test question: "${currentQuestion.question}"`,
              timestamp: new Date().toISOString(),
            }
          ],
          context: {
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation,
            category: currentQuestion.category
          },
          mode: "quiz-help",
          style: activeStyle,
          language: activeLang,
        }),
      });

      if (!response.ok) {
        throw new Error("Tutor API failed");
      }

      const data = await response.json();
      setAiTip(data.content);
    } catch (err: any) {
      console.error(err);
      setAiTip("Unable to generate an explanation right now. Please try again.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleStyleChange = (style: "normal" | "simple") => {
    if (setSettings) {
      setSettings((prev: any) => ({ ...prev, explanationStyle: style }));
    }
    if (aiTip) {
      handleAskEnyiAI(style, explanationLanguage);
    }
  };

  const handleLanguageChange = (lang: string) => {
    if (setSettings) {
      setSettings((prev: any) => ({ ...prev, explanationLanguage: lang }));
    }
    if (aiTip) {
      handleAskEnyiAI(explanationStyle, lang);
    }
  };

  const handleCompleteAndLog = () => {
    onCompleteQuiz(score);
  };

  const currentProgPercentage = ((currentIndex + 1) / activeQuestions.length) * 100;

  // Results screen.
  if (showFeedbackSummary) {
    const accuracy = Math.round((score / activeQuestions.length) * 100);
    const passed = score >= 6; // USCIS standard is 6+ out of 10

    // Build a real summary based on actual performance per category
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(categoryPerformance).forEach(([category, stats]) => {
      const { correct, total } = stats as { correct: number; total: number };
      const rate = total > 0 ? correct / total : 0;
      if (rate >= 0.8) {
        strengths.push(`${category} (${correct}/${total} correct)`);
      } else if (rate < 0.6) {
        weaknesses.push(`${category} (${correct}/${total} correct)`);
      }
    });

    // Fallback if categorical performance scores fall in the middle
    if (strengths.length === 0 && weaknesses.length === 0) {
      Object.entries(categoryPerformance).forEach(([category, stats]) => {
        const { correct, total } = stats as { correct: number; total: number };
        if (correct === total) {
          strengths.push(category);
        } else {
          weaknesses.push(category);
        }
      });
    }

    if (strengths.length === 0 && weaknesses.length === 0) {
      if (passed) {
        strengths.push("General Civics & Government");
      } else {
        weaknesses.push("General Civics concepts");
      }
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-4 font-sans select-none">
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden p-6 md:p-8 space-y-6 text-center shadow-md">
          {/* Medal / Trophy Icon */}
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
              passed
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}>
              <Award className="w-8 h-8" />
            </div>
          </div>

          {/* Test Status Banner */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              {passed ? "Practice Complete" : "Review Recommended"}
            </h2>
            <p className="text-xs text-gray-400">
              {passed
                ? "Good work. You met the practice passing score."
                : "Review the questions you missed, then try another practice round."}
            </p>
          </div>

          {/* Practice score summary */}
          <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-5 my-2">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Questions</span>
              <span className="text-lg font-black text-gray-900 leading-snug">{activeQuestions.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Correct Score</span>
              <span className="text-lg font-black text-primary leading-snug">{score}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Accuracy Rate</span>
              <span className={`text-lg font-black leading-snug ${passed ? "text-emerald-600" : "text-amber-500"}`}>
                {accuracy}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-primary-container text-primary font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm border border-primary/10">
            <Sparkles className="w-4 h-4 text-primary animate-bounce shrink-0" />
            <span>You earned {score * 20 + (passed ? 50 : 0)} points! Keep it up.</span>
          </div>

          {/* Strengths and Weaknesses Section */}
          <div className="text-left space-y-4 pt-1 border-t border-gray-50">
            <h3 className="text-xs font-extrabold text-gray-950 uppercase tracking-widest block">
              Results Summary
            </h3>

            {/* Strengths List */}
            {strengths.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block select-none">
                  ✓ Core Strengths:
                </span>
                <ul className="space-y-1.5">
                  {strengths.map((str, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2 leading-relaxed">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses List */}
            {weaknesses.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block select-none font-sans">
                  ⚠️ Areas to Review
                </span>
                <ul className="space-y-1.5">
                  {weaknesses.map((wk, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2 leading-relaxed font-sans">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Learning Suggestions */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-left flex items-start gap-3">
            <Compass className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Suggested Next Step:</span>
              <p className="text-xs text-gray-600 leading-normal">
                Review the categories listed above and spend a few minutes with the related flashcards before your next practice session.
              </p>
            </div>
          </div>

          <button
            onClick={handleCompleteAndLog}
            className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-sm select-none cursor-pointer text-center uppercase tracking-wider"
          >
            Save Performance & Logs View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-2">
      <div className="w-full">
        <div className="flex justify-between items-end mb-2 font-sans text-xs text-[#6b7280]">
          <span className="flex items-center gap-1.5 font-medium text-primary uppercase tracking-wide">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            Civics Practice • {currentQuestion.category}
          </span>
          <span className="font-semibold text-primary font-mono select-none">
            QUESTION {currentIndex + 1} OF {activeQuestions.length}
          </span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${currentProgPercentage}%` }}
          />
        </div>
      </div>

      <div className="w-full bg-white rounded-xl p-6 md:p-8 border border-[#e5e7eb] shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-gray-400 tracking-wider uppercase font-sans">
          <span>Module: {currentQuestion.category}</span>
        </div>

        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-5">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-snug flex-grow min-w-0">
            {currentQuestion.question}
          </h3>
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
                setIsSpeaking(false);
              } else {
                speakText(
                  currentQuestion.question,
                  () => setIsSpeaking(true),
                  () => setIsSpeaking(false)
                );
              }
            }}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isSpeaking
                ? "bg-[#eff6ff] text-[#2563eb] border-blue-200 animate-pulse"
                : "bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title="Listen to question read aloud"
          >
            <Volume2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </button>
        </div>

        {/* Buttons to ask AI or change settings */}
        <div className="bg-gray-50/50 p-3 sm:p-4 rounded-xl border border-gray-100 mb-6 space-y-3 font-sans">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-3 flex-wrap">
            {/* Ask Enyi AI Button */}
            <button
              onClick={() => handleAskEnyiAI()}
              disabled={loadingAi}
              className="flex items-center justify-center gap-1 sm:gap-1.5 bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-colors font-bold text-[10px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-lg shrink-0 cursor-pointer shadow-sm active:scale-95 uppercase tracking-wide"
            >
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
              <span className="hidden xs:inline">{loadingAi ? "Loading..." : "Ask Enyi"}</span>
              <span className="xs:hidden">{loadingAi ? "..." : "Enyi"}</span>
            </button>

            {/* Explanation style buttons */}
            <div className="flex items-center gap-1 bg-white border border-gray-200/80 rounded-lg p-0.5 shrink-0 text-[9px] sm:text-[10px]">
              <button
                type="button"
                onClick={() => handleStyleChange("normal")}
                className={`py-1 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-bold rounded-md cursor-pointer transition-all whitespace-nowrap ${
                  explanationStyle === "normal" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                id="btn-explain-simply"
                onClick={() => handleStyleChange("simple")}
                className={`py-1 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-bold rounded-md cursor-pointer transition-all flex items-center gap-0.5 whitespace-nowrap ${
                  explanationStyle === "simple" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Simple 💡
              </button>
            </div>

            {/* Language selector */}
            <div className="relative shrink-0 w-28 sm:w-32">
              <div className="flex items-center gap-1 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 select-none">
                <Globe className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
              </div>
              <select
                id="select-translation"
                value={explanationLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full text-[9px] sm:text-[10px] pl-5 sm:pl-6.5 pr-1.5 sm:pr-2 py-1.5 sm:py-2 border border-gray-200 bg-white rounded-lg outline-none cursor-pointer font-semibold text-gray-700 hover:bg-gray-50/50 appearance-none text-center select-none"
              >
                {["English", "Spanish", "French", "Arabic", "Igbo"].map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {currentQuestion.options.map((option, idx) => {
            const prefix = queryPrefixes[idx];
            const isSelected = selectedOption === prefix;
            const isCorrectOption = prefix === currentQuestion.correctAnswer;

            let buttonClass = "bg-white hover:bg-gray-50/30 border border-[#e5e7eb] text-gray-800 hover:border-gray-300";
            let prefixClass = "bg-gray-50 text-gray-500 border border-gray-200/50";

            if (isSelected) {
              buttonClass = "border-primary bg-primary-container text-primary font-medium";
              prefixClass = "bg-primary text-white border-primary";
            }

            {/* Show green for correct, red for wrong */}
            if (isChecked) {
              if (isCorrectOption) {
                buttonClass = "border-emerald-500 bg-emerald-50/10 text-emerald-950 font-bold";
                prefixClass = "bg-emerald-500 text-white border-emerald-500";
              } else if (isSelected) {
                buttonClass = "border-red-500 bg-red-50/10 text-red-950 font-bold";
                prefixClass = "bg-red-500 text-white border-red-500";
              } else {
                buttonClass = "border-gray-100 bg-gray-50/30 text-gray-400 opacity-60";
                prefixClass = "bg-gray-50 text-gray-400 border-gray-100";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isChecked}
                onClick={() => handleSelectOption(prefix)}
                className={`text-left transition-all duration-150 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 flex items-start gap-2 sm:gap-3 w-full option ${buttonClass} ${!isChecked ? "cursor-pointer active:scale-99" : ""}`}
              >
                <div className={`w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 select-none transition-colors ${prefixClass}`}>
                  {prefix}
                </div>
                <span className="font-sans text-[11px] sm:text-xs pt-0.5 sm:pt-1 leading-snug sm:leading-relaxed break-words">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isChecked && (
        <div className={`p-5 rounded-xl border border-dashed font-sans animate-fade-in ${
          selectedOption === currentQuestion.correctAnswer ? "bg-emerald-50/5 border-emerald-200 text-emerald-900" : "bg-red-50/5 border-red-200 text-red-900"
        }`}>
          <div className="flex items-start gap-2.5">
            {selectedOption === currentQuestion.correctAnswer ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="font-bold text-xs">
                {selectedOption === currentQuestion.correctAnswer ? "Correct" : "Incorrect"}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {currentQuestion.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {aiTip && (
        <div className="bg-primary-container border border-primary/10 p-5 rounded-xl animate-fade-in space-y-2">
          <div className="flex items-center gap-1.5 text-primary font-bold text-xs font-sans">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AI Tutor: ({explanationLanguage} Explanation style • {explanationStyle})</span>
          </div>
          <div className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-line pl-5 font-medium bg-white/50 p-3 rounded-lg border border-primary/5">
            {aiTip}
          </div>
        </div>
      )}

      <div className="w-full flex justify-between items-center pt-2 select-none font-sans">
        <button
          onClick={() => onChangeView("home")}
          className="font-bold text-xs sm:text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <Home className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-400" />
          <span className="hidden xs:inline">Dashboard</span>
        </button>

        {!isChecked ? (
          <button
            onClick={handleCheckAnswer}
            disabled={!selectedOption}
            id="check-answer"
            className="font-bold text-xs sm:text-sm bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:hover:bg-primary px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span className="hidden xs:inline">Check Answer</span>
            <span className="xs:hidden">Check</span>
            <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            id="next-question"
            className="font-bold text-xs sm:text-sm bg-emerald-600 text-white hover:bg-emerald-700 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span className="hidden xs:inline">{currentIndex + 1 >= activeQuestions.length ? "View Results" : "Next Question"}</span>
            <span className="xs:hidden">{currentIndex + 1 >= activeQuestions.length ? "Results" : "Next"}</span>
            <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

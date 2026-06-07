import React from "react";
import { UserStats, StudySession } from "../types";
import { PlayCircle, Award, Brain, Activity, Clock, Layers, ArrowRight, BookOpen } from "lucide-react";

interface HomeViewProps {
  stats: UserStats;
  recentSessions: StudySession[];
  onChangeView: (view: "home" | "practice" | "flashcards" | "tutor" | "progress") => void;
  onStartPractice: () => void;
  profileName: string;
  settings?: any;
  setSettings?: any;
}

export default function HomeView({
  stats,
  recentSessions,
  onChangeView,
  onStartPractice,
  profileName,
  settings,
  setSettings,
}: HomeViewProps) {
  const prepPercentage = Math.min(100, Math.max(0, stats.masteredQuestionsCount));

  return (
    <div id="home-view" className="space-y-8 animate-fade-in min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start lg:items-center gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight break-words">
            Welcome Back, {profileName}
          </h2>
          <p className="text-[#6b7280] font-sans text-xs sm:text-sm mt-0.5">
            Ready to keep studying for your citizenship interview?
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 text-gray-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-200 text-[10px] sm:text-xs font-medium whitespace-nowrap">
            <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
            <span>{stats.activeStreak} Streak</span>
          </div>
          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-primary-container text-primary font-bold text-[10px] sm:text-xs flex items-center justify-center border border-primary/10 shrink-0">
            {profileName.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        <section className="xl:col-span-2 bg-white rounded-xl border border-[#e5e7eb] p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center min-w-0">
          <div className="relative w-28 sm:w-32 md:w-36 h-28 sm:h-32 md:h-36 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-gray-100"
                cx="50"
                cy="50"
                fill="none"
                r="40"
                stroke="currentColor"
                strokeWidth="7"
              ></circle>
              <circle
                className="text-[#2563eb]"
                cx="50"
                cy="50"
                fill="none"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * prepPercentage) / 100}
                strokeLinecap="round"
                strokeWidth="7"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                {prepPercentage}%
              </span>
              <span className="text-[8px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Mastery</span>
            </div>
          </div>

          <div className="flex-grow z-10 text-center sm:text-left space-y-2 sm:space-y-3 min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
              USCIS Civics Test Progress
            </h3>
            <div className="flex items-baseline justify-center sm:justify-start gap-1 flex-wrap">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2563eb]">
                {stats.masteredQuestionsCount}
              </span>
              <span className="text-[#6b7280] font-sans text-[10px] sm:text-xs">
                / 100 Questions Mastered
              </span>
            </div>
            
            <p className="text-[10px] sm:text-xs text-gray-400 font-sans leading-relaxed">
              Based on your flashcards progress. Study consistently to push this up to 100% before your exam.
            </p>

            <div className="pt-1 flex flex-col xs:flex-row gap-2 justify-center sm:justify-start w-full sm:w-auto">
              <button
                onClick={onStartPractice}
                id="resume-study"
                className="bg-primary hover:bg-primary-hover text-white font-medium px-3 sm:px-4 py-2 rounded-lg text-xs transition-colors active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Resume Study
              </button>
              <button
                onClick={() => onChangeView("progress")}
                id="view-analytics"
                className="border border-[#e5e7eb] text-gray-700 hover:bg-gray-50 font-medium px-3 sm:px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                View Analytics
              </button>
            </div>
          </div>
        </section>

        <section className="xl:col-span-1 bg-white rounded-xl p-4 sm:p-6 border border-[#e5e7eb] flex flex-col justify-between min-h-min min-w-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1.5 text-primary min-w-0">
                <PlayCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-sans select-none text-primary">
                  Next Up
                </span>
              </div>
              <span className="bg-primary-container text-primary text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full select-none shrink-0">
                History
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 select-none break-words">
                American History: 1800s
              </h4>
              <p className="text-[10px] sm:text-xs text-[#6b7280] leading-relaxed font-sans">
                Review key questions about the Civil War, Abraham Lincoln, and major occurrences in the 19th century.
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-gray-600 text-[10px] sm:text-xs font-medium">
              <div className="flex items-center gap-2">
                <Award className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 text-primary" />
                <span>10 Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 text-primary" />
                <span>Est. 15 mins</span>
              </div>
            </div>
          </div>

          <button
            onClick={onStartPractice}
            id="start-next-up-session"
            className="w-full mt-6 bg-primary text-white font-medium py-2 px-3 rounded-lg hover:bg-primary-hover transition-colors flex justify-center items-center gap-2 text-xs shadow-sm cursor-pointer"
          >
            Start Section
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>

        <section className="col-span-1 xl:col-span-3 bg-primary-container rounded-xl border border-primary/10 p-6 hover:shadow-sm transition-all flex flex-col lg:flex-row items-center justify-between gap-6 min-w-0">
          <div className="flex items-center gap-4 text-left min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-md font-bold text-gray-900">
                Stuck on a civics concept?
              </h3>
              <p className="text-xs text-[#6b7280] max-w-2xl font-sans mt-0.5 leading-relaxed">
                Our Enyi AI can explain difficult historical questions, answer questions about civics topics, or simulate mock oral interviews for you.
              </p>
            </div>
          </div>
          <button
            onClick={() => onChangeView("tutor")}
            id="chat-with-enyi"
            className="w-full lg:w-auto bg-primary text-white hover:bg-primary-hover font-medium px-5 py-2.5 rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
          >
            Chat with Enyi AI
          </button>
        </section>

        <section className="col-span-1 xl:col-span-3 bg-white rounded-xl border border-[#e5e7eb] p-6 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Recent Activity
            </h3>
            <button
              onClick={() => onChangeView("progress")}
              className="text-xs text-primary font-medium hover:underline cursor-pointer"
            >
              See All History
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {recentSessions.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center font-sans">
                No study activity recorded yet.
              </p>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-primary-hover flex-shrink-0">
                      {session.type === "Practice" ? (
                        <BookOpen className="w-4 h-4 text-primary" />
                      ) : session.type === "Flashcards" ? (
                        <Layers className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Brain className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 font-sans">
                        {session.module}
                      </p>
                      <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                        {session.type} • {session.type === "Practice" ? `Score: ${session.score}/${session.totalQuestions}` : `Reviewed cards`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium font-sans">
                    {session.date}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="rounded-xl overflow-hidden bg-gray-50/50 border border-gray-100 flex flex-col lg:flex-row items-center justify-between p-6 gap-6 relative min-h-[160px] min-w-0">
        <div className="flex-1 min-w-0 space-y-1.5 text-left z-10">
          <h4 className="text-lg font-bold text-gray-900">Your Citizenship Journey</h4>
          <p className="text-xs text-[#6b7280] font-sans max-w-lg leading-relaxed">
            Keep studying – you’re getting closer to citizenship.
          </p>
        </div>
        <img
          alt="Citizens illustration"
          referrerPolicy="no-referrer"
          className="w-full max-w-[240px] h-28 object-contain opacity-80 mix-blend-multiply z-10"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDHd9J2nemM5qdF_H-GvbsLPOlasgPNFj0RUJUrMxo-_sUcykUUVCxUHlDOz1W8d0QZeZgFisnP7Va0sndmpee03bUGeL1eSlHd7KdrVDz5bPepaVxtOdwxZ8WsK0gxmvZCy3gn8EFlQqdeywHSMqaQrbOkTwRBIhFpuMv_iaKKL-ykrx2yyftyGglonUOPLLSrIJ1ME2tuWVacKI2swqOrl5gyxGeLue-vFGZ97mEX-zdGhx3dCTxCKHliaS5lYYTmTJrw97Hd-w"
        />
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Calendar, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import EnyiLogo from "./EnyiLogo";

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any, stats: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("");
  const [examDate, setExamDate] = useState<string>("");
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleGuestAccess = () => {
    onAuthSuccess("guest-token", {
      id: "guest",
      profile_name: "Guest",
      isGuest: true,
    }, null);
  };

  const formatExamDateStr = (dateVal: string) => {
    if (!dateVal) return "";
    try {
      const parsed = new Date(dateVal);
      if (isNaN(parsed.getTime())) return "";
      const year = parsed.getUTCFullYear();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[parsed.getUTCMonth()];
      const day = parsed.getUTCDate();
      return `${month} ${day}, ${year}`;
    } catch {
      return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all core login fields.");
      return;
    }

    if (!isLogin && !profileName) {
      setError("Please specify your Profile Name.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin 
        ? { email, password }
        : { email, password, profile_name: profileName, exam_date: formatExamDateStr(examDate) };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please check your credentials.");
      }

      onAuthSuccess(data.token, data.user, data.stats);
    } catch (err: any) {
      console.error("Auth submit error:", err);
      setError(err.message || "Failed to authenticate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfcfd] p-4 select-none">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-container opacity-40 blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-50 opacity-40 blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl shadow-xl p-8 z-10 relative overflow-hidden"
      >
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <EnyiLogo size={32} />
            <span className="font-bold text-xl text-[#1e3a8a] tracking-tight">Enyi Path</span>
          </div>
          <h2 className="text-xl font-bold font-headline text-gray-900 tracking-tight">
            {isLogin ? "Sign in to your account" : "Create your study account"}
          </h2>
          <p className="text-xs text-gray-500 font-sans max-w-xs leading-normal">
            {isLogin 
              ? "Sign in to save your study progress and track your daily streak." 
              : "Sign up to start saving your progress, track your streak, and prepare for the test."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 flex items-start gap-2.5 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Your Profile Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-gray-800 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block flex items-center justify-between">
                <span>Target USCIS Exam Date</span>
                <span className="text-[10px] text-gray-400 font-normal">Optional</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={examDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExamDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-xl text-xs tracking-wider transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <span>{isLogin ? "LOG IN TO STUDY" : "CREATE ACCOUNT & START"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-150"></div>
            <span className="flex-shrink mx-3 text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-gray-150"></div>
          </div>

          <button
            type="button"
            onClick={handleGuestAccess}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 font-semibold py-3 px-4 rounded-xl text-xs tracking-wider transition-all shadow-xs active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>CONTINUE AS GUEST</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-xs text-primary hover:text-primary-hover font-semibold transition-all hover:underline"
          >
            {isLogin ? "Need a study account? Register here" : "Already have a study account? Sign in"}
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
            <span>Practice quizzes, flashcards, and mock interviews.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

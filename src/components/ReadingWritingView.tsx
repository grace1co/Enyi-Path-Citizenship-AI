import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Play,
  RefreshCw,
  Check,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  PenTool,
  HelpCircle,
  Sparkles,
  Award
} from "lucide-react";
import { speakText, stopSpeaking } from "../utils/speech";

interface ReadingWritingViewProps {
  onAwardPoints: (points: number) => void;
  settings?: any;
  setSettings?: any;
}

export default function ReadingWritingView({
  onAwardPoints,
  settings,
  setSettings,
}: ReadingWritingViewProps) {
  const [activeTab, setActiveTab] = useState<"reading" | "writing">("reading");
  const [data, setData] = useState<{
    reading: { id: number; sentence: string }[];
    writing: { id: number; sentence: string; audioText: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [readingIdx, setReadingIdx] = useState(0);
  const [writingIdx, setWritingIdx] = useState(0);

  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [vocalTranscript, setVocalTranscript] = useState("");
  const [readingChecked, setReadingChecked] = useState(false);
  const [readingPassed, setReadingPassed] = useState<boolean | null>(null);

  const [typedInput, setTypedInput] = useState("");
  const [writingChecked, setWritingChecked] = useState(false);
  const [writingPassed, setWritingPassed] = useState<boolean | null>(null);

  const recognitionRef = useRef<any>(null);

  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);

  const [isTestMode, setIsTestMode] = useState(false);
  const [testStage, setTestStage] = useState<"not_started" | "reading" | "writing" | "completed">("not_started");
  const [testReadingSentences, setTestReadingSentences] = useState<{ id: number; sentence: string }[]>([]);
  const [testWritingSentences, setTestWritingSentences] = useState<{ id: number; sentence: string; audioText: string }[]>([]);
  const [testReadingAttempts, setTestReadingAttempts] = useState<{ sentence: string; spoken: string; passed: boolean }[]>([]);
  const [testWritingAttempts, setTestWritingAttempts] = useState<{ sentence: string; typed: string; expected: string; passed: boolean }[]>([]);
  const [testReadingIndex, setTestReadingIndex] = useState(0);
  const [testWritingIndex, setTestWritingIndex] = useState(0);
  const [testReadingResult, setTestReadingResult] = useState<"passed" | "failed" | null>(null);
  const [testWritingResult, setTestWritingResult] = useState<"passed" | "failed" | null>(null);
  const [hasAwardedCompletedPoints, setHasAwardedCompletedPoints] = useState(false);

  useEffect(() => {
    fetch("/data/reading-writing-sentences.json")
      .then((res) => {
        if (!res.ok) throw new Error("Status failed");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load reading-writing data:", err);
        setLoading(false);
      });

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    stopSpeaking();
    setIsPlayingAudio(false);
    resetVocalOrTyped();
  }, [activeTab, readingIdx, writingIdx]);

  const resetVocalOrTyped = () => {
    setVocalTranscript("");
    setIsRecording(false);
    setReadingChecked(false);
    setReadingPassed(null);
    setTypedInput("");
    setWritingChecked(false);
    setWritingPassed(null);
    setPointsAwarded(null);
  };

  const startNewTest = () => {
    if (!data) return;
    
    // Select 3 random reading sentences
    const shuffledReading = [...data.reading].sort(() => 0.5 - Math.random()).slice(0, 3);
    // Select 3 random writing sentences
    const shuffledWriting = [...data.writing].sort(() => 0.5 - Math.random()).slice(0, 3);

    setTestReadingSentences(shuffledReading);
    setTestWritingSentences(shuffledWriting);
    setTestReadingAttempts([]);
    setTestWritingAttempts([]);
    setTestReadingIndex(0);
    setTestWritingIndex(0);
    setTestReadingResult(null);
    setTestWritingResult(null);
    setHasAwardedCompletedPoints(false);
    resetVocalOrTyped();

    setTestStage("reading");
  };

  useEffect(() => {
    if (
      isTestMode &&
      testStage === "completed" &&
      testReadingResult === "passed" &&
      testWritingResult === "passed" &&
      !hasAwardedCompletedPoints
    ) {
      onAwardPoints(100);
      setHasAwardedCompletedPoints(true);
    }
  }, [isTestMode, testStage, testReadingResult, testWritingResult, hasAwardedCompletedPoints, onAwardPoints]);

  const handleSpeakSample = (text: string) => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      const rate = isSlowMode ? 0.65 : 0.90;
      speakText(
        text,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        rate
      );
    }
  };

  // ----- SPEECH TO TEXT SETUP -----
  const startSTT = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition (STT) is not fully supported in this browser. Please use Chrome/Safari for reading practice.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      setVocalTranscript("");
      setReadingChecked(false);
      setReadingPassed(null);
      setPointsAwarded(null);

      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setVocalTranscript(transcript);
      };

      rec.onerror = (e: any) => {
        console.warn("STT error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("STT initiation error:", err);
      setIsRecording(false);
    }
  };

  const stopSTT = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // ----- EVALUATORS -----
  const verifyReading = (correctText: string) => {
    if (!vocalTranscript) return;
    setReadingChecked(true);

    const targetWords = correctText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/);
    const spokenWords = vocalTranscript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/);

    // Score based on word presence match rate
    let matchCount = 0;
    targetWords.forEach((tw) => {
      if (spokenWords.includes(tw)) matchCount++;
    });

    const isMatchSuccessful = matchCount / targetWords.length >= 0.70;
    setReadingPassed(isMatchSuccessful);

    if (isTestMode) {
      const newAttempts = [
        ...testReadingAttempts,
        { sentence: correctText, spoken: vocalTranscript, passed: isMatchSuccessful }
      ];
      setTestReadingAttempts(newAttempts);
      if (isMatchSuccessful) {
        setTestReadingResult("passed");
      } else if (testReadingIndex >= 2) {
        setTestReadingResult("failed");
      }
    } else {
      if (isMatchSuccessful) {
        onAwardPoints(30);
        setPointsAwarded(30);
      }
    }
  };

  const verifyWriting = (correctText: string) => {
    if (!typedInput) return;
    setWritingChecked(true);

    const normTarget = correctText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();
    const normTyped = typedInput.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();

    const targetWords = normTarget.split(" ").filter(Boolean);
    const typedWords = normTyped.split(" ").filter(Boolean);

    const matchedWords = targetWords.filter((word) =>
      typedWords.includes(word)
    );

    const score = targetWords.length > 0 ? (matchedWords.length / targetWords.length) : 0;

    const isMatchSuccessful = normTarget === normTyped || score >= 0.85;
    setWritingPassed(isMatchSuccessful);

    if (isTestMode) {
      const newAttempts = [
        ...testWritingAttempts,
        { sentence: correctText, typed: typedInput, expected: correctText, passed: isMatchSuccessful }
      ];
      setTestWritingAttempts(newAttempts);
      if (isMatchSuccessful) {
        setTestWritingResult("passed");
      } else if (testWritingIndex >= 2) {
        setTestWritingResult("failed");
      }
    } else {
      if (isMatchSuccessful) {
        onAwardPoints(35);
        setPointsAwarded(35);
      }
    }
  };

  // Helper word-by-word renderer for Reading Results Highlights
  const renderReadingWordFeedback = (correctText: string) => {
    const rawTarget = correctText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/);
    const spokenNorm = vocalTranscript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");

    return (
      <div className="flex flex-wrap gap-1.5 p-4 bg-gray-50 border border-gray-100 rounded-xl mt-3 select-none">
        {rawTarget.map((word, i) => {
          const matched = spokenNorm.includes(word.toLowerCase());
          return (
            <span
              key={i}
              className={`text-sm font-bold px-1.5 py-0.5 rounded-md ${
                matched ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-amber-700 bg-amber-50 border border-amber-100"
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Reading & Writing Lessons...</p>
      </div>
    );
  }

  const readingItem = data?.reading[readingIdx] || { id: 1, sentence: "The President lives in the White House." };
  const writingItem = data?.writing[writingIdx] || { id: 1, sentence: "The President lives in the White House.", audioText: "The President lives in the White House." };

  return (
    <div className="max-w-3xl mx-auto min-w-0 space-y-6 animate-fade-in py-2">
      <div className="flex justify-between items-center bg-white border border-[#e5e7eb] p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-container text-primary rounded-lg shrink-0">
            {isTestMode ? <Award className="w-5 h-5 text-primary" /> : (activeTab === "reading" ? <BookOpen className="w-5 h-5 text-primary" /> : <PenTool className="w-5 h-5 text-primary" />)}
          </div>
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-snug">Oral Communication Module</h2>
            <p className="text-[10px] sm:text-xs text-gray-400">Practice reading out loud and writing what you hear.</p>
          </div>
        </div>

        {/* Slow down the voice for easier listening */}
        <button
          onClick={() => setIsSlowMode(!isSlowMode)}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
            isSlowMode
              ? "bg-[#eff6ff] text-[#2563eb] border-blue-200"
              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Slow Dictation Rate: {isSlowMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Switch between free practice and test mode */}
      <div className="grid grid-cols-2 gap-2 bg-[#eef3f7] p-1 rounded-xl">
        <button
          onClick={() => {
            setIsTestMode(false);
            resetVocalOrTyped();
          }}
          className={`py-2 px-4 text-xs font-bold tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase ${
            !isTestMode
              ? "bg-white text-[#1e3a8a] shadow-sm font-black"
              : "text-[#6b7280] hover:text-gray-900"
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>I. Practice Sheets</span>
        </button>
        <button
          onClick={() => {
            setIsTestMode(true);
            setTestStage("not_started");
            resetVocalOrTyped();
          }}
          className={`py-2 px-4 text-xs font-bold tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase ${
            isTestMode
              ? "bg-white text-[#1e3a8a] shadow-sm font-black"
              : "text-[#6b7280] hover:text-gray-900"
          }`}
        >
          <Award className="w-4 h-4 text-[#d97706]" />
          <span>II. USCIS Test Mode</span>
        </button>
      </div>

      {/* Show the test steps (not started, reading, writing, done) */}
      {isTestMode ? (
        <div className="space-y-6">
          {/* Explain the test rules before starting */}
          {testStage === "not_started" && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#fef3c7] text-[#d97706] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900">USCIS English Exam Simulation</h3>
                <p className="text-gray-500 text-[10px] sm:text-xs leading-normal">
                  Simulate the real USCIS English test.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-left text-xs text-gray-600 space-y-4 max-w-lg mx-auto">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-[#dbeafe] text-blue-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <p className="leading-relaxed">
                    <strong>English Reading:</strong> You will be shown up to <strong>3 sentences</strong> one-by-one. You must read at least <strong>1 sentence</strong> correctly of the three to pass.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-[#dbeafe] text-blue-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <p className="leading-relaxed">
                    <strong>English Writing:</strong> You will listen to up to <strong>3 dictations</strong> one-by-one. You must spell at least <strong>1 sentence</strong> correctly of the three to pass.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-[#d1fae5] text-emerald-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <p className="leading-relaxed font-semibold text-gray-800">
                    Perfect Run Award: Pass both modules to earn a simulation report and +100 study points!
                  </p>
                </div>
              </div>

              <button
                onClick={startNewTest}
                className="bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold px-8 py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer hover:shadow hover:scale-102 select-none"
              >
                Start USCIS Certification Test
              </button>
            </div>
          )}

          {testStage === "reading" && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex justify-between items-center text-xs text-gray-400 select-none">
                <span className="font-extrabold text-[#d97706] flex items-center gap-1 uppercase">
                  <Award className="w-4 h-4 text-[#d97706]" /> USCIS Simulated Examination
                </span>
                <span className="font-mono text-[#1e3a8a] font-bold">READING ATTEMPT {testReadingIndex + 1} OF 3</span>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-900">
                <p className="leading-relaxed">
                  <strong>Rule check:</strong> You must read <strong>one of the three</strong> sentences correctly. Currently on Attempt #{testReadingIndex + 1}. Once you succeed, you immediately qualify and advance.
                </p>
              </div>

              {/* Target Sentence */}
              {testReadingSentences[testReadingIndex] && (
                <div className="bg-[#fbfcff] p-6 rounded-xl border border-blue-50 flex justify-between items-center gap-6">
                  <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-normal select-none">
                    {testReadingSentences[testReadingIndex].sentence}
                  </p>
                  <button
                    onClick={() => handleSpeakSample(testReadingSentences[testReadingIndex].sentence)}
                    className={`p-3 rounded-xl border shrink-0 transition-colors cursor-pointer ${
                      isPlayingAudio
                        ? "bg-[#eff6ff] text-[#2563eb] border-blue-300 animate-pulse"
                        : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    title="Hear dynamic pronunciation help"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Voice Recorder Block */}
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <button
                    onClick={isRecording ? stopSTT : startSTT}
                    className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-[#2563eb] text-white hover:bg-blue-600 hover:shadow"
                    }`}
                    title={isRecording ? "Stop recording voice" : "Start reading aloud right now"}
                  >
                    {isRecording ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                  </button>
                  <p className="text-xs font-bold text-gray-400 mt-2 lowercase select-none">
                    {isRecording ? "Listening to your voice..." : "Click to read sentence aloud"}
                  </p>
                </div>

                {/* Spoken results if any */}
                {vocalTranscript && (
                  <div className="space-y-1.5 p-4 bg-[#fbfcfd] border border-gray-200 rounded-xl">
                    <span className="text-[10px] font-extrabold text-blue-600 block uppercase tracking-wider select-none">Voice Detected:</span>
                    <p className="text-md font-sans text-gray-800 italic">“{vocalTranscript}”</p>
                  </div>
                )}

                {vocalTranscript && !readingChecked && (
                  <button
                    onClick={() => verifyReading(testReadingSentences[testReadingIndex].sentence)}
                    className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Submit and Verify Reading Attempt</span>
                  </button>
                )}

                {/* Verdict Feedback */}
                {readingChecked && (
                  <div className="space-y-4 animate-fade-in font-sans">
                    {readingPassed ? (
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Attempt #{testReadingIndex + 1} Passed!</h4>
                          <p className="text-xs text-emerald-700 leading-normal">
                            Splendid! You successfully passed the USCIS Reading requirement.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Attempt #{testReadingIndex + 1} Did Not Match</h4>
                          <p className="text-xs text-amber-700 leading-normal">
                            {testReadingIndex < 2 
                              ? "That attempt didn't hit the pronunciation threshold. You have remaining attempts." 
                              : "No attempts matched. Moving on to the writing portion."}
                          </p>
                        </div>
                      </div>
                    )}

                    {testReadingSentences[testReadingIndex] && (
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Pronunciation Heatmap:</span>
                        {renderReadingWordFeedback(testReadingSentences[testReadingIndex].sentence)}
                      </div>
                    )}

                    {/* Test Navigation buttons */}
                    <div className="flex justify-end pt-2">
                      {readingPassed ? (
                        <button
                          onClick={() => {
                            setTestStage("writing");
                            resetVocalOrTyped();
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow hover:scale-102 active:scale-95"
                        >
                          <span>Proceed to Writing Test</span>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </button>
                      ) : (
                        testReadingIndex < 2 ? (
                          <button
                            onClick={() => {
                              setTestReadingIndex(prev => prev + 1);
                              resetVocalOrTyped();
                            }}
                            className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow hover:scale-102 active:scale-95"
                          >
                            <span>Proceed to Attempt {testReadingIndex + 2}</span>
                            <ArrowRight className="w-4 h-4 text-white" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setTestStage("writing");
                              resetVocalOrTyped();
                            }}
                            className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow hover:scale-102 active:scale-95"
                          >
                            <span>Proceed to Writing Test</span>
                            <ArrowRight className="w-4 h-4 text-white" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {testStage === "writing" && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex justify-between items-center text-xs text-gray-400 select-none">
                <span className="font-extrabold text-[#d97706] flex items-center gap-1 uppercase">
                  <Award className="w-4 h-4 text-[#d97706]" /> USCIS Simulated Examination
                </span>
                <span className="font-mono text-[#1e3a8a] font-bold">WRITING ATTEMPT {testWritingIndex + 1} OF 3</span>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-900">
                <p className="leading-relaxed">
                  <strong>Rule check:</strong> You must write <strong>one of the three</strong> dictated sentences correctly. Currently on Attempt #{testWritingIndex + 1}. Once you succeed, you immediately qualify and complete the exam.
                </p>
              </div>

              {testWritingSentences[testWritingIndex] && (
                <div className="flex flex-col items-center justify-center p-8 bg-[#fdfeff] border border-blue-100 rounded-xl text-center space-y-4">
                  <button
                    onClick={() => handleSpeakSample(testWritingSentences[testWritingIndex].audioText)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 border border-blue-100 ${
                      isPlayingAudio
                        ? "bg-[#eff6ff] text-[#2563eb] animate-pulse scale-102"
                        : "bg-[#2563eb] text-white hover:bg-blue-600"
                    }`}
                    title="Play dictation voice"
                  >
                    {isPlayingAudio ? <Volume2 className="w-6 h-6 text-[#2563eb]" /> : <Play className="w-6 h-6 text-white" />}
                  </button>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block select-none">Play Dictation Audio:</span>
                    <p className="text-xs text-gray-400">
                      Listen closely to the official dictation line and submit your exact spelling below.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block select-none">Type Dictated Sentence:</label>
                  <textarea
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    disabled={writingChecked}
                    placeholder="e.g. Washington was the first President."
                    rows={3}
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-md font-sans outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50/50 disabled:text-gray-500"
                  />
                </div>

                {typedInput && !writingChecked && (
                  <button
                    onClick={() => verifyWriting(testWritingSentences[testWritingIndex].sentence)}
                    className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Submit and Verify Spelling</span>
                  </button>
                )}

                {writingChecked && (
                  <div className="space-y-4 animate-fade-in font-sans">
                    {writingPassed ? (
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Attempt #{testWritingIndex + 1} Passed!</h4>
                          <p className="text-xs text-emerald-700 leading-normal">
                            Perfect spelling and syntax! You have satisfied the writing requirement.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Attempt #{testWritingIndex + 1} Did Not Match</h4>
                          <p className="text-xs text-amber-700 leading-normal">
                            {testWritingIndex < 2 
                              ? "Spelling was incorrect. Don't worry, you have backup slots." 
                              : "All 3 attempts explored. Let's tally the official score."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Test Navigation buttons */}
                    <div className="flex justify-end pt-2">
                      {writingPassed ? (
                        <button
                          onClick={() => {
                            setTestStage("completed");
                          }}
                          className="bg-[#10b981] hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow hover:scale-102"
                        >
                          <span>Finish and View Report</span>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </button>
                      ) : (
                        testWritingIndex < 2 ? (
                          <button
                            onClick={() => {
                              setTestWritingIndex(prev => prev + 1);
                              resetVocalOrTyped();
                            }}
                            className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow hover:scale-102 progress-btn animate-bounce"
                          >
                            <span>Proceed to Attempt {testWritingIndex + 2}</span>
                            <ArrowRight className="w-4 h-4 text-white" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setTestStage("completed");
                            }}
                            className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow hover:scale-102"
                          >
                            <span>Finish and View Report</span>
                            <ArrowRight className="w-4 h-4 text-white" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {testStage === "completed" && (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden shadow-md">
              {/* Certificate Header Banner */}
              <div className="p-6 text-center space-y-3 bg-[#f8fafc] border-b border-gray-100 select-none">
                <div className="w-16 h-16 bg-[#d1fae5] text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 font-headline uppercase tracking-tight">Citizenship Mock Exam Complete</h3>
                  <p className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">USCIS Communication Simulation Report</p>
                </div>
              </div>

              {/* Section Scores */}
              <div className="p-6 space-y-6">
                {testReadingResult === "passed" && testWritingResult === "passed" ? (
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-5 flex items-start gap-3.5">
                    <Award className="w-6 h-6 text-[#059669] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-emerald-900 leading-snug">CONGRATULATIONS: PASS VERDICT!</h4>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        You passed both the Reading and Writing standards in 100% compliance with USCIS assessment protocols. 
                        <strong>+100 study points</strong> have been awarded to your score indicator!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-5 flex items-start gap-3.5">
                    <AlertCircle className="w-6 h-6 text-[#d97706] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-amber-900 leading-snug">EXAM COMPLETED (CONDITIONAL FAIL)</h4>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        You did not pass both portions of the communication simulation under standard USCIS limits. Keep practicing individual vocab sheets to hit the 85%+ dictation spell rates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Breakdowns columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 py-2">
                  {/* Reading breakdown */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">I. Reading Test</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        testReadingResult === "passed" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {testReadingResult === "passed" ? "Pass" : "Fail"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Attempts Recorded:</span>
                        <span className="font-bold text-gray-800">{testReadingAttempts.length} of 3</span>
                      </div>
                      
                      {/* List attempts */}
                      <div className="space-y-1.5 pt-1.5">
                        {testReadingAttempts.map((item, i) => (
                          <div key={i} className="bg-white border border-gray-100 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-gray-400">Attempt #{i + 1}</span>
                              <span className={`font-semibold ${item.passed ? "text-emerald-600" : "text-amber-500"}`}>
                                {item.passed ? "Passed" : "Did not match"}
                              </span>
                            </div>
                            <p className="font-bold text-gray-800 truncate">"{item.sentence}"</p>
                            <p className="text-gray-500 italic text-[11px] truncate">Spoke: "{item.spoken || "No speech captured"}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Writing breakdown */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">II. Writing Test</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        testWritingResult === "passed" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {testWritingResult === "passed" ? "Pass" : "Fail"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Attempts Recorded:</span>
                        <span className="font-bold text-gray-800">{testWritingAttempts.length} of 3</span>
                      </div>

                      {/* List attempts */}
                      <div className="space-y-1.5 pt-1.5">
                        {testWritingAttempts.map((item, i) => (
                          <div key={i} className="bg-white border border-gray-100 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-gray-400">Attempt #{i + 1}</span>
                              <span className={`font-semibold ${item.passed ? "text-emerald-600" : "text-amber-500"}`}>
                                {item.passed ? "Passed" : "Did not match"}
                              </span>
                            </div>
                            <p className="font-bold text-gray-800 truncate">"{item.sentence}"</p>
                            <p className="text-gray-500 italic text-[11px] truncate">Typed: "{item.typed || "(empty)"}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="p-6 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-3.5 text-center">
                <button
                  onClick={() => {
                    setIsTestMode(false);
                    setTestStage("not_started");
                    resetVocalOrTyped();
                  }}
                  className="w-full sm:w-auto text-xs text-gray-600 font-bold hover:text-black hover:bg-gray-100 px-5 py-3 rounded-xl border border-gray-200 transition-colors cursor-pointer select-none"
                >
                  Return to Endless Practice
                </button>

                <button
                  onClick={startNewTest}
                  className="w-full sm:w-auto bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold px-7 py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer select-none"
                >
                  Take Another Test
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "reading" && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 md:p-8 space-y-6 shadow-sm font-sans">
              <div className="flex justify-between items-center text-xs text-gray-400 select-none">
                <span className="font-bold text-primary font-sans uppercase">Sentence pronunciation matching</span>
                <span className="font-mono text-[#1e3a8a] font-semibold">SENTENCE {readingIdx + 1} OF {data?.reading.length || 1}</span>
              </div>

              {/* Large Sentence Display Card */}
              <div className="bg-[#fbfcff] p-6 rounded-xl border border-blue-50 flex justify-between items-center gap-6">
                <p className="text-lg md:text-xl font-bold font-headline select-none text-gray-900 leading-normal">
                  {readingItem.sentence}
                </p>

                {/* Listen pronounciation */}
                <button
                  onClick={() => handleSpeakSample(readingItem.sentence)}
                  className={`p-3 rounded-xl border shrink-0 transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? "bg-[#eff6ff] text-[#2563eb] border-blue-300 animate-pulse"
                      : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                  title="Hear how to pronounce this sentence out loud"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Microphone Interactive Speaking Area */}
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <button
                    onClick={isRecording ? stopSTT : startSTT}
                    className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-primary text-white hover:bg-primary-hover hover:shadow"
                    }`}
                    title={isRecording ? "Stop recording voice" : "Start reading aloud right now"}
                  >
                    {isRecording ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                  </button>
                  <p className="text-xs font-bold text-gray-400 mt-2 lowercase select-none">
                    {isRecording ? "Listening to your speech..." : "Click to read sentence aloud"}
                  </p>
                </div>

                {/* Vocal Transcript Box */}
                {vocalTranscript && (
                  <div className="space-y-1.5 p-4 bg-[#fbfcfd] border border-gray-200 rounded-xl">
                    <span className="text-[10px] font-extrabold text-blue-600 block uppercase tracking-wider select-none">Your Spoken Voice Transcript:</span>
                    <p className="text-md font-sans text-gray-800 italic">“{vocalTranscript}”</p>
                  </div>
                )}

                {/* Verification triggers */}
                {vocalTranscript && !readingChecked && (
                  <button
                    onClick={() => verifyReading(readingItem.sentence)}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:shadow"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Verify My Pronunciation Match</span>
                  </button>
                )}

                {/* Match feedback displays */}
                {readingChecked && (
                  <div className="space-y-4 animate-fade-in font-sans">
                    {readingPassed ? (
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Perfect Accuracy Match!</h4>
                          <p className="text-xs text-emerald-700 leading-normal">
                            You read the sentence clearly and matched the USCIS naturalization oral thresholds cleanly.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Needs Slower Review</h4>
                          <p className="text-xs text-amber-700 leading-normal">
                            Your pronunciation match score falls short. Re-listen to the speaking help and read again, aiming for crisp enunciation.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Score point awards alerts */}
                    {pointsAwarded && (
                      <div className="p-3 bg-primary-container text-primary text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm border border-primary/10 select-none max-w-max">
                        <Sparkles className="w-4 h-4 text-primary animate-bounce shrink-0" />
                        <span>Awarded: +{pointsAwarded} study points!</span>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Pronunciation Heatmap Evaluation:</span>
                      {renderReadingWordFeedback(readingItem.sentence)}
                    </div>

                    {/* Navigation panel */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (data && readingIdx + 1 < data.reading.length) {
                            setReadingIdx((prev) => prev + 1);
                          } else {
                            setReadingIdx(0); // loop
                          }
                        }}
                        className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow hover:scale-102 active:scale-95"
                      >
                        <span>Next reading line</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "writing" && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex justify-between items-center text-xs text-gray-400 select-none font-sans">
                <span className="font-bold text-primary uppercase">Dictation spelling & grammar typing</span>
                <span className="font-mono text-[#1e3a8a] font-semibold">SENTENCE {writingIdx + 1} OF {data?.writing.length || 1}</span>
              </div>

              {/* Dictation Voice trigger */}
              <div className="flex flex-col items-center justify-center p-8 bg-[#fdfeff] border border-blue-100 rounded-xl text-center space-y-4">
                <button
                  onClick={() => handleSpeakSample(writingItem.audioText)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 border border-blue-100 ${
                    isPlayingAudio
                      ? "bg-[#eff6ff] text-[#2563eb] animate-pulse scale-102"
                      : "bg-primary text-white hover:bg-primary-hover"
                  }`}
                  title="Speak dictation sentence"
                >
                  {isPlayingAudio ? <Volume2 className="w-6 h-6 text-[#2563eb]" /> : <Play className="w-6 h-6 text-white" />}
                </button>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block select-none">Play Dictation:</span>
                  <p className="text-xs text-gray-400">
                    Play the audio, listen closely, and type what you hear. Tap to pause or change dictation rate above.
                  </p>
                </div>
              </div>

              {/* Response typing area */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block select-none">Type Dictated Sentence:</label>
                  <textarea
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    disabled={writingChecked}
                    placeholder="e.g. Washington was the first President."
                    rows={3}
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-md font-sans outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50/50 disabled:text-gray-500"
                  />
                </div>

                {typedInput && !writingChecked && (
                  <button
                    onClick={() => verifyWriting(writingItem.sentence)}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Verify Dictation Spelling</span>
                  </button>
                )}

                {/* Verdict panels */}
                {writingChecked && (
                  <div className="space-y-4 animate-fade-in font-sans">
                    {writingPassed ? (
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Perfect Writing Master Class!</h4>
                          <p className="text-xs text-emerald-700 leading-normal">
                            Your spelling and word order are perfect. You are fully prepared for this portion of the USCIS interview.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Your spelling isn’t quite right</h4>
                          <p className="text-xs text-amber-700 leading-normal">
                            Compare your answer to the correct one below and try again.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Score point awards alerts */}
                    {pointsAwarded && (
                      <div className="p-3 bg-primary-container text-primary text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm border border-primary/10 select-none max-w-max">
                        <Sparkles className="w-4 h-4 text-primary animate-bounce shrink-0" />
                        <span>Awarded: +{pointsAwarded} study points!</span>
                      </div>
                    )}

                    {/* Comparison feedback columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 select-none">
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-1">
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase block tracking-wider">Correct Sentence Model:</span>
                        <p className="text-sm font-bold text-gray-900 leading-normal">{writingItem.sentence}</p>
                      </div>
                      <div className="bg-[#fbfcff] border border-blue-50 p-4 rounded-xl space-y-1">
                        <span className="text-[9px] font-extrabold text-[#6b7280] uppercase block tracking-wider">Your Transcript Typed:</span>
                        <p className={`text-sm font-bold leading-normal ${writingPassed ? "text-emerald-700 font-bold" : "text-amber-700"}`}>
                          {typedInput}
                        </p>
                      </div>
                    </div>

                    {/* Navigation panel */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => {
                          setTypedInput("");
                          setWritingChecked(false);
                          setWritingPassed(null);
                          setPointsAwarded(null);
                        }}
                        className="text-xs text-gray-600 font-bold hover:text-black hover:bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                      >
                        Try spelling again
                      </button>

                      <button
                        onClick={() => {
                          if (data && writingIdx + 1 < data.writing.length) {
                            setWritingIdx((prev) => prev + 1);
                          } else {
                            setWritingIdx(0); // loop
                          }
                        }}
                        className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center gap-1.5 hover:shadow hover:scale-102 active:scale-95"
                      >
                        <span>Next dictation line</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

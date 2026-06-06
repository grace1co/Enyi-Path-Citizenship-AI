import React, { useState } from "react";
import { Flashcard } from "../types";
import { ArrowLeft, ArrowRight, RotateCw, Check, RefreshCw, Star, Layers, Volume2 } from "lucide-react";
import { speakText, stopSpeaking } from "../utils/speech";

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onToggleMastery: (id: number) => void;
  settings?: any;
  setSettings?: any;
}

export default function FlashcardsView({
  flashcards,
  onToggleMastery,
  settings,
  setSettings,
}: FlashcardsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  const [cardFilter, setCardFilter] = useState<"all" | "review" | "mastered">("all");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFeedback, setShowFeedback] = useState<"know" | "review" | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);

  React.useEffect(() => {
    setIsSpeaking(false);
    stopSpeaking();
  }, [currentIndex, isFlipped]);

  React.useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const filteredFlashcards = flashcards.filter((card) => {
    const categoryMatches = selectedCategory === "All" || card.category === selectedCategory;
    const repMatches =
      cardFilter === "all"
        ? true
        : cardFilter === "review"
        ? !card.isMastered
        : card.isMastered;
    return categoryMatches && repMatches;
  });

  const categories = [
    "All",
    "Principles of American Democracy",
    "System of Government",
    "American History",
    "Symbols & Holidays"
  ];

  const currentCard = filteredFlashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setShowFeedback(null);
    if (filteredFlashcards.length === 0) return;
    if (currentIndex + 1 < filteredFlashcards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // wrap around
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowFeedback(null);
    if (filteredFlashcards.length === 0) return;
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredFlashcards.length - 1); // wrap around last
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowFeedback(null);
  };

  const handleCardFilterChange = (filter: "all" | "review" | "mastered") => {
    setCardFilter(filter);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowFeedback(null);
  };

  // Mark the card as mastered and move to the next card.
  const handleKnowIt = () => {
    if (!currentCard) return;
    setIsFlipped(true); // show answer briefly
    setShowFeedback("know");
    
    if (!currentCard.isMastered) {
      onToggleMastery(currentCard.id);
    }

    setTimeout(() => {
      handleNext();
    }, 1000);
  };

  // Keep the card in the review queue and move to the next card.
  const handleReviewLater = () => {
    if (!currentCard) return;
    setIsFlipped(true); // show answer briefly
    setShowFeedback("review");

    if (currentCard.isMastered) {
      onToggleMastery(currentCard.id);
    }

    setTimeout(() => {
      handleNext();
    }, 1000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in py-2">

      <div className="space-y-4 text-center select-none font-sans">
        <h2 className="text-xl font-bold text-gray-900">Civics Flashcards</h2>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
          Review civics questions and track which topics you already know.
        </p>

        {/* Show mastered, review, or all cards */}
        <div className="flex bg-gray-100 p-1 rounded-xl max-w-xs mx-auto gap-1">
          {[
            { id: "all", label: "All Cards" },
            { id: "review", label: "Review Pile ↺" },
            { id: "mastered", label: "Mastered ✓" },
          ].map((pile) => (
            <button
              key={pile.id}
              onClick={() => handleCardFilterChange(pile.id as any)}
              className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                cardFilter === pile.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {pile.label}
            </button>
          ))}
        </div>

        {/* Let user pick a category */}
        <div className="flex gap-1.5 p-1 overflow-x-auto scrollbar-none justify-start sm:justify-center py-1 border-t border-gray-50 pt-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100/80"
              }`}
            >
              {cat === "Principles of American Democracy" ? "Democracy Principles" : cat}
            </button>
          ))}
        </div>
      </div>

      {filteredFlashcards.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] p-10 rounded-xl text-center font-sans text-xs text-gray-400 space-y-2">
          <span>🗂️</span>
          <p className="font-semibold block text-gray-500">No cards in your selected "{cardFilter}" view.</p>
          <p className="text-[10px] max-w-xs mx-auto text-gray-400">
            {cardFilter === "review"
              ? "Wonderful job! You mastered every flashcard in this topic area. Go to Progress overview or launch practice tests."
              : cardFilter === "mastered"
              ? "You haven't mastered any flashcards in this category yet. Click 'Know It' on study cards to move them here!"
              : "Try switching categories or piles to view available materials."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show which card number we're on */}
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold font-sans px-1">
            <span className="bg-gray-100 px-2.5 py-1 rounded-md text-gray-500 uppercase tracking-wider">
              {currentCard.category}
            </span>
            <span className="font-mono text-gray-500">
              CARD {currentIndex + 1} OF {filteredFlashcards.length}
            </span>
          </div>


          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full relative h-[250px] cursor-pointer group perspective select-none"
          >

            <div
              className={`w-full h-full duration-500 transform-style preserve-3d relative rounded-xl border transition-all ${
                currentCard.isMastered
                  ? "border-emerald-200 bg-emerald-50/5"
                  : "border-[#e5e7eb] bg-white hover:border-gray-300"
              } shadow-sm flex items-center justify-center p-6 text-center ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >

              {currentCard.isMastered && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-100/80 text-emerald-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider border border-emerald-200">
                  <Star className="w-2.5 h-2.5" fill="currentColor" />
                  <span>KNOW IT</span>
                </div>
              )}


              {showFeedback === "know" && (
                <div className="absolute inset-0 bg-emerald-500/90 text-white rounded-xl z-20 flex flex-col items-center justify-center gap-2 animate-fade-in">
                  <Check className="w-10 h-10 stroke-[3]" />
                  <span className="font-bold text-sm tracking-wider uppercase">Mastered! Point Gained</span>
                </div>
              )}

              {showFeedback === "review" && (
                <div className="absolute inset-0 bg-amber-500/90 text-white rounded-xl z-20 flex flex-col items-center justify-center gap-2 animate-fade-in">
                  <RefreshCw className="w-10 h-10 animate-spin" />
                  <span className="font-bold text-sm tracking-wider uppercase">Added to Review Queue</span>
                </div>
              )}


              <div
                className={`space-y-4 backface-hidden ${
                  isFlipped ? "opacity-0" : "opacity-100"
                } transition-opacity duration-200 flex flex-col items-center justify-center w-full`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                    {currentCard.topic}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSpeaking) {
                        stopSpeaking();
                        setIsSpeaking(false);
                      } else {
                        speakText(
                          currentCard.question,
                          () => setIsSpeaking(true),
                          () => setIsSpeaking(false)
                        );
                      }
                    }}
                    className={`p-1 rounded-full border transition-all cursor-pointer ${
                      isSpeaking
                        ? "bg-[#eff6ff] text-[#2563eb] border-blue-200 animate-pulse"
                        : "bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-700"
                    }`}
                    title="Pronounce Question"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm md:text-md font-bold text-gray-900 leading-snug px-3 max-w-sm">
                  {currentCard.question}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium pt-3 font-sans">
                  <RotateCw className="w-3 h-3 text-primary animate-pulse" />
                  <span>Click card to reveal answer</span>
                </div>
              </div>


              <div
                className={`space-y-4 backface-hidden absolute rotate-y-180 flex flex-col items-center justify-center ${
                  isFlipped ? "opacity-100" : "opacity-0"
                } transition-opacity duration-200 w-full h-full p-6`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold tracking-wider text-primary uppercase">
                    Approved Answer
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSpeaking) {
                        stopSpeaking();
                        setIsSpeaking(false);
                      } else {
                        speakText(
                          currentCard.answer,
                          () => setIsSpeaking(true),
                          () => setIsSpeaking(false)
                        );
                      }
                    }}
                    className={`p-1 rounded-full border transition-all cursor-pointer ${
                      isSpeaking
                        ? "bg-[#eff6ff] text-[#2563eb] border-blue-200 animate-pulse"
                        : "bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-700"
                    }`}
                    title="Pronounce Answer"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-md md:text-lg font-extrabold text-primary leading-snug px-4">
                  {currentCard.answer}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium pt-3 font-sans">
                  <RotateCw className="w-3 h-3 text-primary" />
                  <span>Click card to show question</span>
                </div>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-2 gap-3 pb-2 font-sans">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleKnowIt();
              }}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer shadow-sm active:scale-95 transition-all uppercase tracking-wide"
            >
              <Check className="w-4 h-4 text-white shrink-0" />
              <span>✓ Know It</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReviewLater();
              }}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer border border-[#e5e7eb] shadow-sm active:scale-95 transition-all uppercase tracking-wide"
            >
              <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
              <span>↺ Review Later</span>
            </button>
          </div>


          <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold font-sans">
              * Tips: Mastering cards awards study points!
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="w-9 h-9 rounded-lg border border-[#e5e7eb] bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer shadow-sm"
                aria-label="Previous card"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="w-9 h-9 rounded-lg border border-[#e5e7eb] bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer shadow-sm"
                aria-label="Next card"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

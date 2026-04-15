"use client";

import { motion } from "framer-motion";
import { XCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function FlashcardsModal({ isOpen, onClose, flashcards, currentIndex, setCurrentIndex, showAnswer, setShowAnswer }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">Flashcards</h3>
          <button onClick={onClose}><XCircle className="w-5 h-5" /></button>
        </div>
        {flashcards.length > 0 ? (
          <>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 min-h-[200px] flex flex-col items-center justify-center cursor-pointer"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              <p className="text-xs text-indigo-500 mb-3">Card {currentIndex + 1} of {flashcards.length}</p>
              <p className="text-xl font-medium text-center">{showAnswer ? flashcards[currentIndex].back : flashcards[currentIndex].front}</p>
              <p className="text-xs text-slate-400 mt-4">Tap to flip</p>
            </motion.div>
            <div className="flex justify-between mt-4">
              <button onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setShowAnswer(false); }} disabled={currentIndex === 0}>
                <ChevronLeft />
              </button>
              <span>{currentIndex + 1}/{flashcards.length}</span>
              <button onClick={() => { setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1)); setShowAnswer(false); }} disabled={currentIndex === flashcards.length - 1}>
                <ChevronRight />
              </button>
            </div>
          </>
        ) : (
          <p className="text-center py-8">No flashcards generated.</p>
        )}
      </div>
    </div>
  );
}
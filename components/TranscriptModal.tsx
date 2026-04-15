"use client";

import { XCircle } from "lucide-react";

export default function TranscriptModal({ isOpen, onClose, transcript }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">Transcript</h3>
          <button onClick={onClose}><XCircle className="w-5 h-5" /></button>
        </div>
        <pre className="whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">{transcript}</pre>
        <button onClick={() => { navigator.clipboard.writeText(transcript); alert("Copied!"); }} className="mt-4 w-full py-2 border border-indigo-200 text-indigo-700 rounded-lg">
          Copy
        </button>
      </div>
    </div>
  );
}
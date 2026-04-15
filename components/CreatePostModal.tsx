"use client";

import { X, Upload, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

const POST_TYPES = [
  { value: "note", label: "Note", icon: "📝" },
  { value: "question", label: "Question", icon: "❓" },
  { value: "group", label: "Group", icon: "👥" },
];

export default function CreatePostModal({ isOpen, onClose, title, setTitle, desc, setDesc, type, setType, selectedFile, setSelectedFile, isUploading, onSubmit }: any) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && setSelectedFile(files[0]),
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg", ".gif"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-lg mb-3">Create Post</h3>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 mb-3" />
        <textarea placeholder="What's on your mind?" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className="w-full p-3 border rounded-xl bg-slate-50 mb-3" />
        <div className="flex gap-4 mb-3">
          {POST_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-2">
              <input type="radio" value={t.value} checked={type === t.value} onChange={(e) => setType(e.target.value)} />
              {t.icon} {t.label}
            </label>
          ))}
        </div>
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer mb-3 ${isDragActive ? "border-indigo-400 bg-indigo-50" : "border-slate-300"}`}>
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="flex items-center justify-between">
              <span className="text-sm truncate">{selectedFile.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto text-slate-400" />
              <p className="text-sm">Drop file or click</p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border rounded-xl">Cancel</button>
          <button onClick={onSubmit} disabled={isUploading || !title.trim() || !desc.trim()} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
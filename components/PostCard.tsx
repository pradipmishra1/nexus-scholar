"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Bookmark, File } from "lucide-react";

const POST_TYPES = [
  { value: "note", label: "Note", icon: "📝", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "question", label: "Question", icon: "❓", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "group", label: "Group", icon: "👥", color: "bg-green-50 text-green-700 border-green-200" },
];

export default function PostCard({ post, currentUserId, onLike, onToggleComments, commentInput, onCommentChange, onAddComment }: any) {
  const typeConfig = POST_TYPES.find((t) => t.value === post.type) || POST_TYPES[0];
  const isExpanded = post.showComments;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${typeConfig.color}`}>{typeConfig.icon} {typeConfig.label}</span>
          <span className="text-xs text-slate-500">{post.profiles?.full_name || "Anonymous"}</span>
        </div>
        <span className="text-xs text-slate-400">{new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
      <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
      <p className="text-slate-600 text-sm whitespace-pre-wrap">{post.description}</p>
      {post.file_url && (
        <div className="mt-3 p-2 bg-slate-50 rounded-lg border flex items-center justify-between">
          <div className="flex items-center gap-2"><File className="w-4 h-4 text-indigo-500" /><span className="text-xs text-slate-600">Attachment</span></div>
          <a href={post.file_url} target="_blank" className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-full">View</a>
        </div>
      )}
      <div className="flex items-center gap-5 mt-4 pt-2 border-t border-slate-100">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 transition" style={{ color: post.user_has_liked ? "#ef4444" : "#64748b" }}>
          <Heart className="w-5 h-5" fill={post.user_has_liked ? "#ef4444" : "none"} />
          <span className="text-sm">{post.likes}</span>
        </button>
        <button onClick={() => onToggleComments(post.id)} className="flex items-center gap-1.5 text-slate-500">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comments.length}</span>
        </button>
        <button className="ml-auto text-slate-400"><Bookmark className="w-4 h-4" /></button>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-3 border-t overflow-hidden">
            {post.comments.length > 0 ? (
              <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                {post.comments.map((c: any) => (
                  <div key={c.id} className="bg-slate-50 p-2 rounded-lg">
                    <span className="font-medium">{c.profiles?.full_name || "User"}:</span> {c.content}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-3">No comments yet.</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentInput}
                onChange={(e) => onCommentChange(e.target.value)}
                className="flex-1 p-2 text-sm border rounded-lg bg-slate-50"
              />
              <button onClick={() => onAddComment(post.id)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
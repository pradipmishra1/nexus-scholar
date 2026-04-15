"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, LogOut, Bell, Trophy, Mic, Sparkles, Play, Pause, RotateCcw,
  AlertCircle, FileText, Search, Users, User, Heart, MessageCircle, Upload,
  X, Download, ChevronLeft, ChevronRight, Plus, UserPlus, UserMinus, Copy,
  XCircle, Loader2, Bookmark, File, Send, MoreHorizontal, TrendingUp,
  Calendar, Clock, Zap,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import CreatePostModal from "@/components/CreatePostModal";
import TranscriptModal from "@/components/TranscriptModal";
import FlashcardsModal from "@/components/FlashcardsModal";
import PostCard from "@/components/PostCard";

const MOODS = [
  { emoji: "😊", label: "Great" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Low" },
];

const POST_TYPES = [
  { value: "note", label: "Note", icon: "📝", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "question", label: "Question", icon: "❓", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "group", label: "Group", icon: "👥", color: "bg-green-50 text-green-700 border-green-200" },
] as const;

export default function HomePage() {
  const { user, profile, signOut } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"all" | "note" | "question" | "group">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Create post state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [postType, setPostType] = useState<"note" | "question" | "group">("note");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Comments state
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  // Wellness state
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setError(null);
    const { data, error } = await supabase
      .from("posts")
      .select(`*, profiles:user_id (full_name), comments (id, content, user_id, created_at, profiles:user_id (full_name))`)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Failed to load posts");
      return;
    }

    if (data) {
      const { data: likesData } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
      const likedIds = new Set(likesData?.map((l) => l.post_id) || []);
      const formattedPosts = data.map((post) => ({
        ...post,
        user_has_liked: likedIds.has(post.id),
        showComments: expandedComments.has(post.id),
      }));
      setPosts(formattedPosts);
    }
    setLoading(false);
  }, [user, expandedComments]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchPosts();
    }
  }, [user, fetchPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!user) return;
    if (!postTitle.trim() || !postDesc.trim()) return;
    setIsUploading(true);

    let fileData = null;
    if (selectedFile) {
      const fileName = `${user.id}/${Date.now()}.${selectedFile.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("notes").upload(fileName, selectedFile);
      if (!error) {
        const { data } = supabase.storage.from("notes").getPublicUrl(fileName);
        fileData = { url: data.publicUrl, type: selectedFile.type };
      }
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      type: postType,
      title: postTitle,
      description: postDesc,
      file_url: fileData?.url,
      file_type: fileData?.type,
      likes: 0,
    });

    setIsUploading(false);
    if (!error) {
      setPostTitle("");
      setPostDesc("");
      setSelectedFile(null);
      setShowCreatePost(false);
      fetchPosts();
    }
  };

  const handleLike = async (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || !user) return;

    const newLikedState = !post.user_has_liked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: newLikedState ? p.likes + 1 : p.likes - 1, user_has_liked: newLikedState }
          : p
      )
    );

    if (newLikedState) {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      await supabase.from("posts").update({ likes: post.likes + 1 }).eq("id", postId);
    } else {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      await supabase.from("posts").update({ likes: post.likes - 1 }).eq("id", postId);
    }
  };

  const toggleComments = (postId: number) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const handleAddComment = async (postId: number) => {
    if (!user) return;
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: user.id, content })
      .select(`*, profiles:user_id (full_name)`)
      .single();

    if (!error && data) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, data] } : p))
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  // Timer - fixed version
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === 0) {
            if (timerMinutes === 0) {
              clearInterval(timerRef.current!);
              setTimerActive(false);
              if (timerMode === "focus") {
                setTimerMode("break");
                setTimerMinutes(5);
              } else {
                setTimerMode("focus");
                setTimerMinutes(25);
              }
              setTimerSeconds(0);
              return 0;
            } else {
              setTimerMinutes((m) => m - 1);
              return 59;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timerMinutes, timerMode]);

  // AI Transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        setIsAILoading(true);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob);
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await res.json();
          if (data.transcript) {
            setTranscript(`📝 Transcript:\n${data.transcript}\n\n✨ Summary:\n${data.summary}`);
            setShowTranscriptModal(true);
          }
        } catch {
          alert("Transcription failed");
        }
        setIsAILoading(false);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied");
    }
  };

  // AI Flashcards
  const generateFlashcards = async () => {
    setIsAILoading(true);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: postDesc || "Create flashcards from your study material." }),
      });
      const data = await res.json();
      if (data.cards?.length) {
        setFlashcards(data.cards);
        setCurrentCardIndex(0);
        setShowAnswer(false);
        setShowFlashcardsModal(true);
      }
    } catch {
      alert("Failed to generate flashcards");
    }
    setIsAILoading(false);
  };

  const filteredPosts = useMemo(() => {
    if (filterType === "all") return posts;
    return posts.filter((p) => p.type === filterType);
  }, [posts, filterType]);

  if (!user) return null;

  return (
    <div className="pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-md">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
            Nexus Scholar
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border">
            <Bell className="w-5 h-5 text-slate-500" />
          </button>
          <button
            onClick={signOut}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border"
          >
            <LogOut className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </motion.div>

      {/* Welcome & Points */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-5"
      >
        <div>
          <p className="text-sm text-slate-500">Welcome back,</p>
          <p className="font-semibold text-slate-800 text-lg">
            {profile?.full_name || user.email?.split("@")[0]}
          </p>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-full border border-amber-200 shadow-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-amber-700">{profile?.points || 0}</span>
          <span className="text-amber-600 text-xs">pts</span>
        </div>
      </motion.div>

      {/* AI Action Bar */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording}
          disabled={isAILoading}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all shadow-sm ${
            isRecording
              ? "bg-red-500 text-white animate-pulse shadow-red-200"
              : "bg-white border border-indigo-200 text-indigo-700 hover:shadow-md"
          } disabled:opacity-50`}
        >
          <Mic className="w-4 h-4" />
          {isRecording ? "Recording..." : "Transcribe"}
        </button>
        <button
          onClick={generateFlashcards}
          disabled={isAILoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-purple-200 text-purple-700 rounded-xl text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          Flashcards
        </button>
      </div>

      {/* Wellness Row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 shadow-sm"
        >
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Daily Mood
          </p>
          <div className="flex justify-around">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                onClick={() => setSelectedMood(m.emoji)}
                className={`text-3xl p-2 rounded-full transition-all ${
                  selectedMood === m.emoji
                    ? "bg-indigo-100 scale-110 shadow-sm"
                    : "hover:bg-slate-100"
                }`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          {selectedMood && (
            <p className="text-xs text-indigo-600 mt-3 text-center font-medium">
              {selectedMood === "😊" && "Great! Keep that energy going!"}
              {selectedMood === "😐" && "Steady progress is still progress."}
              {selectedMood === "😔" && "Take it easy today. Try a short focus session."}
            </p>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 shadow-sm"
        >
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            {timerMode === "focus" ? "🎯 Focus Mode" : "☕ Break Time"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-mono font-bold text-indigo-700">
              {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
            </span>
            <div className="flex gap-1">
              {!timerActive ? (
                <button
                  onClick={() => setTimerActive(true)}
                  className="p-2 bg-indigo-100 rounded-full text-indigo-600 hover:bg-indigo-200 transition"
                >
                  <Play className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    clearInterval(timerRef.current!);
                    setTimerActive(false);
                  }}
                  className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200 transition"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  clearInterval(timerRef.current!);
                  setTimerActive(false);
                  setTimerMinutes(timerMode === "focus" ? 25 : 5);
                  setTimerSeconds(0);
                }}
                className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Pills */}
      <div className="flex p-1 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-sm mb-5">
        {["all", "note", "question", "group"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f as any)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              filterType === f
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Quick Create Post */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="w-full bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm mb-5 text-left text-slate-500 text-sm hover:shadow-md transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4 text-indigo-500" />
        What's on your mind? Share notes or ask a question...
      </button>

      {/* Feed */}
      {loading && !refreshing ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={fetchPosts} className="ml-auto text-sm font-medium underline">
            Retry
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-dashed"
        >
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No posts yet</p>
          <p className="text-sm text-slate-400 mt-1">Create the first one above!</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user.id}
              onLike={handleLike}
              onToggleComments={toggleComments}
              commentInput={commentInputs[post.id] || ""}
              onCommentChange={(val) => setCommentInputs((prev) => ({ ...prev, [post.id]: val }))}
              onAddComment={handleAddComment}
            />
          ))}
        </motion.div>
      )}

      {/* Modals */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        title={postTitle}
        setTitle={setPostTitle}
        desc={postDesc}
        setDesc={setPostDesc}
        type={postType}
        setType={setPostType}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        isUploading={isUploading}
        onSubmit={handleCreatePost}
      />

      <TranscriptModal
        isOpen={showTranscriptModal}
        onClose={() => setShowTranscriptModal(false)}
        transcript={transcript}
      />

      <FlashcardsModal
        isOpen={showFlashcardsModal}
        onClose={() => setShowFlashcardsModal(false)}
        flashcards={flashcards}
        currentIndex={currentCardIndex}
        setCurrentIndex={setCurrentCardIndex}
        showAnswer={showAnswer}
        setShowAnswer={setShowAnswer}
      />
    </div>
  );
}
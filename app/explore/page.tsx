"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  Search, Filter, X, TrendingUp, Clock, Heart, MessageCircle,
  Bookmark, FileText, HelpCircle, Users, Sparkles, ArrowUp,
  ChevronRight, Calendar, Download, Loader2, SlidersHorizontal,
} from "lucide-react";

interface Post {
  id: number;
  type: "note" | "question" | "group";
  title: string;
  description: string;
  file_url: string | null;
  file_type: string | null;
  likes: number;
  created_at: string;
  profiles?: { full_name: string };
  comments: any[] | { count: number }[];
  commentsCount?: number;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "note" | "question" | "group">("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "trending">("latest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select(`*, profiles:user_id (full_name), comments (count)`)
      .order("created_at", { ascending: false });

    if (data) {
      const formatted = data.map((p: any) => ({
        ...p,
        commentsCount: p.comments?.[0]?.count || 0,
      }));
      setPosts(formatted);
      applyFiltersAndSort(formatted, searchQuery, selectedType, sortBy);
      // Calculate trending (most likes in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = formatted.filter((p: Post) => new Date(p.created_at) > sevenDaysAgo);
      const trending = [...recent].sort((a, b) => b.likes - a.likes).slice(0, 5);
      setTrendingPosts(trending);
    }
    setLoading(false);
  };

  const applyFiltersAndSort = (
    allPosts: Post[],
    query: string,
    type: string,
    sort: string
  ) => {
    let filtered = [...allPosts];

    // Search
    if (query.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Type filter
    if (type !== "all") {
      filtered = filtered.filter((p) => p.type === type);
    }

    // Sort
    if (sort === "latest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "popular") {
      filtered.sort((a, b) => b.likes - a.likes);
    }

    setFilteredPosts(filtered);
  };

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  useEffect(() => {
    applyFiltersAndSort(posts, searchQuery, selectedType, sortBy);
  }, [searchQuery, selectedType, sortBy, posts]);

  const handleSave = (postId: number) => {
    setSaving(postId);
    setTimeout(() => setSaving(null), 500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "note": return <FileText className="w-4 h-4" />;
      case "question": return <HelpCircle className="w-4 h-4" />;
      case "group": return <Users className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "note": return "bg-blue-50 text-blue-700 border-blue-200";
      case "question": return "bg-amber-50 text-amber-700 border-amber-200";
      case "group": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
          Discover
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border"
        >
          <SlidersHorizontal className="w-5 h-5 text-slate-600" />
        </button>
      </motion.div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search posts, questions, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Filter Chips */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Post Type</p>
                <div className="flex gap-2">
                  {["all", "note", "question", "group"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type as any)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                        selectedType === type
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {type === "all" ? "All" : type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Sort By</p>
                <div className="flex gap-2">
                  {["latest", "popular", "trending"].map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort as any)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                        sortBy === sort
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending Section (only when no filters active) */}
      {!searchQuery && selectedType === "all" && sortBy !== "trending" && trendingPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-500" />
              Trending Now
            </h2>
            <button className="text-xs text-indigo-600 flex items-center gap-1">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {trendingPosts.map((post) => (
              <motion.div
                key={post.id}
                whileHover={{ scale: 1.02 }}
                className="flex-shrink-0 w-64 bg-white rounded-xl p-3 border shadow-sm cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(post.type)}`}>
                    {getTypeIcon(post.type)} {post.type}
                  </span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2">{post.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{post.profiles?.full_name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {post.likes}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> {post.commentsCount || 0}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-dashed"
        >
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No posts found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              variants={itemVariants}
              layout
              className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(post.type)}`}>
                  {getTypeIcon(post.type)} {post.type}
                </span>
                <span className="text-xs text-slate-500">{post.profiles?.full_name || "Anonymous"}</span>
              </div>
              <h3 className="font-semibold text-slate-800 line-clamp-1">{post.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2 mt-1">{post.description}</p>
              {post.file_url && (
                <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600">
                  <FileText className="w-3 h-3" /> Attachment
                </div>
              )}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> {post.likes}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" /> {post.commentsCount || 0}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSave(post.id); }}
                  className="ml-auto text-slate-400 hover:text-indigo-600 transition"
                >
                  {saving === post.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeColor(selectedPost.type)}`}>
                    {getTypeIcon(selectedPost.type)} {selectedPost.type}
                  </span>
                </div>
                <button onClick={() => setSelectedPost(null)}>
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedPost.title}</h3>
                <p className="text-sm text-slate-500 mb-4">By {selectedPost.profiles?.full_name || "Anonymous"}</p>
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{selectedPost.description}</p>
                {selectedPost.file_url && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                    <span className="text-sm text-slate-600">Attachment</span>
                    <a
                      href={selectedPost.file_url}
                      target="_blank"
                      className="text-indigo-600 text-sm font-medium flex items-center gap-1"
                    >
                      Download <Download className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-4 text-slate-500">
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {selectedPost.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {selectedPost.commentsCount || 0}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(selectedPost.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="p-4 border-t bg-slate-50">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  FileText, Search, Plus, Grid, List, ArrowUpDown, X, Download,
  Calendar, Clock, MoreVertical, Trash2, Edit3, ExternalLink,
  BookOpen, Sparkles, AlertCircle, Loader2, ChevronRight, Filter,
} from "lucide-react";

interface Note {
  id: number;
  title: string;
  description: string;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
  updated_at?: string;
}

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "note")
      .order("created_at", { ascending: false });

    if (data) {
      setNotes(data);
      applyFilters(data, searchQuery, sortBy, sortOrder);
    }
    setLoading(false);
  };

  const applyFilters = (notesData: Note[], query: string, sort: "date" | "title", order: "asc" | "desc") => {
    let filtered = [...notesData];

    // Search
    if (query.trim()) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query.toLowerCase()) ||
          note.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA, compareB;
      if (sort === "date") {
        compareA = new Date(a.created_at).getTime();
        compareB = new Date(b.created_at).getTime();
      } else {
        compareA = a.title.toLowerCase();
        compareB = b.title.toLowerCase();
      }
      if (order === "asc") {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    setFilteredNotes(filtered);
  };

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  useEffect(() => {
    applyFilters(notes, searchQuery, sortBy, sortOrder);
  }, [searchQuery, sortBy, sortOrder, notes]);

  const handleDeleteNote = async (noteId: number) => {
    setDeleting(noteId);
    const { error } = await supabase.from("posts").delete().eq("id", noteId);
    if (!error) {
      setNotes(notes.filter((n) => n.id !== noteId));
      setSelectedNote(null);
    }
    setDeleting(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-md">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
            My Notes
          </h1>
        </div>
        <button
          onClick={() => window.location.href = "/home"} // or open create post modal directly
          className="p-2 bg-indigo-600 text-white rounded-full shadow-md hover:shadow-lg transition hover:scale-105"
        >
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Search & Controls Bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="p-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl"
          title="Sort order"
        >
          <ArrowUpDown className="w-4 h-4 text-slate-500" />
        </button>
        <button
          onClick={() => setSortBy(sortBy === "date" ? "title" : "date")}
          className="p-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
        >
          {sortBy === "date" ? "Date" : "A-Z"}
        </button>
        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          className="p-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl"
        >
          {viewMode === "list" ? <Grid className="w-4 h-4 text-slate-500" /> : <List className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {/* Notes Display */}
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
      ) : filteredNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-dashed"
        >
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notes yet</p>
          <p className="text-sm text-slate-400 mt-1">
            {searchQuery ? "Try a different search term." : "Create your first note from the home page!"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => window.location.href = "/home"}
              className="mt-4 text-indigo-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
            >
              <Plus className="w-4 h-4" /> Create Note
            </button>
          )}
        </motion.div>
      ) : viewMode === "list" ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              variants={itemVariants}
              layout
              className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 line-clamp-1">{note.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{note.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    {note.file_url && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        Attachment
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 ml-2" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              variants={itemVariants}
              layout
              className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedNote(note)}
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">{note.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{note.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-slate-400">{new Date(note.created_at).toLocaleDateString()}</span>
                {note.file_url && (
                  <Download className="w-3 h-3 text-indigo-500" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Note Detail Modal */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedNote(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b flex justify-between items-center">
                <h3 className="font-semibold text-lg">{selectedNote.title}</h3>
                <button onClick={() => setSelectedNote(null)}>
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{selectedNote.description}</p>
                {selectedNote.file_url && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Attachment
                    </span>
                    <a
                      href={selectedNote.file_url}
                      target="_blank"
                      className="text-indigo-600 text-sm font-medium flex items-center gap-1"
                    >
                      Download <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-4">
                  Created: {new Date(selectedNote.created_at).toLocaleString()}
                </p>
              </div>
              <div className="p-4 border-t bg-slate-50 flex gap-2">
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  disabled={deleting === selectedNote.id}
                  className="flex-1 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting === selectedNote.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
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
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface Message {
  id: number;
  group_id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string };
}

export default function GroupChatModal({ isOpen, onClose, groupId, groupName }: any) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !groupId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select(`*, profiles:user_id (full_name)`)
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, groupId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({ group_id: groupId, user_id: user.id, content: newMessage });
    setNewMessage("");
    setSending(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl max-w-md w-full h-[600px] flex flex-col shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-lg">{groupName}</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-slate-500">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${isOwn ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"} rounded-2xl px-4 py-2`}>
                      {!isOwn && <p className="text-xs font-medium text-indigo-600 mb-1">{msg.profiles?.full_name}</p>}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? "text-indigo-200" : "text-slate-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-3 border rounded-xl bg-slate-50"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="p-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
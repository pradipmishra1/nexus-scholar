"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  Users, Plus, UserPlus, UserMinus, Search, X, Calendar,
  BookOpen, ChevronRight, MessageCircle, Crown, Clock, Sparkles,
  Compass, Loader2, Filter,
} from "lucide-react";
import GroupChatModal from "@/components/GroupChatModal";

interface Group {
  id: number;
  name: string;
  description: string;
  subject: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  role?: string;
  profiles?: { full_name: string };
}

export default function GroupsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"myGroups" | "discover" | "create">("myGroups");
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", subject: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);
  const [chatGroup, setChatGroup] = useState<{ id: number; name: string } | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("groups")
      .select(`*, group_members (user_id, role), profiles:created_by (full_name)`)
      .order("created_at", { ascending: false });

    if (data) {
      const groupsWithStatus = data.map((g: any) => ({
        ...g,
        member_count: g.group_members?.length || 0,
        is_member: g.group_members?.some((m: any) => m.user_id === user?.id),
        role: g.group_members?.find((m: any) => m.user_id === user?.id)?.role,
      }));
      setGroups(groupsWithStatus);
      filterGroups(groupsWithStatus, activeTab, searchQuery);
    }
    setLoading(false);
  };

  const filterGroups = (allGroups: Group[], tab: string, query: string) => {
    let filtered = allGroups;
    if (tab === "myGroups") {
      filtered = filtered.filter(g => g.is_member);
    }
    if (query) {
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        (g.subject && g.subject.toLowerCase().includes(query.toLowerCase()))
      );
    }
    setFilteredGroups(filtered);
  };

  useEffect(() => {
    if (user) fetchGroups();
  }, [user]);

  useEffect(() => {
    filterGroups(groups, activeTab, searchQuery);
  }, [groups, activeTab, searchQuery]);

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: groupForm.name,
        subject: groupForm.subject,
        description: groupForm.description,
        created_by: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "admin" });
      setGroupForm({ name: "", subject: "", description: "" });
      setShowCreateModal(false);
      fetchGroups();
    }
    setCreating(false);
  };

  const handleJoinGroup = async (groupId: number) => {
    if (!user) return;
    setJoining(groupId);
    await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
    await fetchGroups();
    setJoining(null);
  };

  const handleLeaveGroup = async (groupId: number) => {
    if (!user) return;
    setJoining(groupId);
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    await fetchGroups();
    setJoining(null);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.05, duration: 0.2 },
    }),
  };

  if (!user) return null;

  return (
    <div className="pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
          Study Groups
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 bg-indigo-600 text-white rounded-full shadow-md hover:shadow-lg transition hover:scale-105"
        >
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/70 backdrop-blur-sm rounded-xl border mb-5">
        {[
          { id: "myGroups", label: "My Groups", icon: Users },
          { id: "discover", label: "Discover", icon: Compass },
          { id: "create", label: "Create", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition ${
              activeTab === tab.id
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {(activeTab === "myGroups" || activeTab === "discover") && (
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-dashed">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No groups found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {activeTab === "myGroups"
                    ? "Join a group to see it here!"
                    : "Be the first to create one!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                    className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-lg font-bold text-indigo-600">
                          {group.name[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{group.name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {group.member_count} members
                            </span>
                            {group.subject && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> {group.subject}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {group.role === "admin" && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2">{group.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {new Date(group.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {group.is_member && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setChatGroup({ id: group.id, name: group.name }); }}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        {group.is_member ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLeaveGroup(group.id); }}
                            disabled={joining === group.id}
                            className="text-red-500 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 transition"
                          >
                            {joining === group.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                            Leave
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleJoinGroup(group.id); }}
                            disabled={joining === group.id}
                            className="text-indigo-600 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 transition"
                          >
                            {joining === group.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "create" && (
          <motion.div
            key="create"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white rounded-2xl p-6 border shadow-sm"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Create a Study Group</h2>
              <p className="text-sm text-slate-500 mt-1">
                Bring students together and collaborate
              </p>
            </div>
            <div className="space-y-4">
              <input
                placeholder="Group Name *"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="w-full p-3 border rounded-xl bg-slate-50"
              />
              <input
                placeholder="Subject (e.g., Mathematics, Physics)"
                value={groupForm.subject}
                onChange={(e) => setGroupForm({ ...groupForm, subject: e.target.value })}
                className="w-full p-3 border rounded-xl bg-slate-50"
              />
              <textarea
                placeholder="Description"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                rows={4}
                className="w-full p-3 border rounded-xl bg-slate-50"
              />
              <button
                onClick={handleCreateGroup}
                disabled={creating || !groupForm.name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {creating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal (alternative) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Create Study Group</h3>
                <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <input
                placeholder="Group Name"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="w-full p-3 border rounded-xl bg-slate-50 mb-3"
              />
              <input
                placeholder="Subject"
                value={groupForm.subject}
                onChange={(e) => setGroupForm({ ...groupForm, subject: e.target.value })}
                className="w-full p-3 border rounded-xl bg-slate-50 mb-3"
              />
              <textarea
                placeholder="Description"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                rows={3}
                className="w-full p-3 border rounded-xl bg-slate-50 mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 border rounded-xl">Cancel</button>
                <button onClick={handleCreateGroup} disabled={creating} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50">
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Detail Modal */}
      <AnimatePresence>
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setSelectedGroup(null)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden" />
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {selectedGroup.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800">{selectedGroup.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> {selectedGroup.member_count} members
                    </p>
                  </div>
                  <button onClick={() => setSelectedGroup(null)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  {selectedGroup.subject && (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      {selectedGroup.subject}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedGroup.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600 mb-4">{selectedGroup.description}</p>
                <div className="border-t pt-4 flex gap-2">
                  {selectedGroup.is_member ? (
                    <>
                      <button
                        onClick={() => { setChatGroup({ id: selectedGroup.id, name: selectedGroup.name }); setSelectedGroup(null); }}
                        className="flex-1 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium"
                      >
                        Open Chat
                      </button>
                      <button
                        onClick={() => { handleLeaveGroup(selectedGroup.id); setSelectedGroup(null); }}
                        className="flex-1 py-3 border border-red-200 text-red-500 rounded-xl font-medium"
                      >
                        Leave Group
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { handleJoinGroup(selectedGroup.id); setSelectedGroup(null); }}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium"
                    >
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Chat Modal */}
      <GroupChatModal
        isOpen={!!chatGroup}
        onClose={() => setChatGroup(null)}
        groupId={chatGroup?.id ?? 0}
        groupName={chatGroup?.name ?? ""}
      />
    </div>
  );
}
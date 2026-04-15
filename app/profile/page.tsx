"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  Trophy, Edit3, Save, X, Settings, LogOut, Award, Star, TrendingUp,
  BookOpen, MessageSquare, Heart, Calendar, Mail, MapPin, Briefcase,
  ChevronRight, Camera, CheckCircle, Lock, Bell, Moon, Sun, Shield,
  User as UserIcon, FileText, Clock, ArrowUpRight, Sparkles,
} from "lucide-react";
import PushNotificationManager from "@/components/PushNotificationManager";
import FollowButton from "@/components/FollowButton";

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<"overview" | "activity" | "achievements" | "settings">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    college: "",
    class_year: "",
    bio: "",
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likesReceived: 0,
    notes: 0,
    questions: 0,
    groupsJoined: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchLeaderboard(),
        fetchStats(),
        fetchRecentActivity(),
        fetchAchievements(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        college: profile.college || "",
        class_year: profile.class_year || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, points")
      .order("points", { ascending: false })
      .limit(10);
    if (data) setLeaderboard(data);
  };

  const fetchStats = async () => {
    if (!user) return;
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    const { count: commentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    const { data: postsLikes } = await supabase
      .from("posts")
      .select("likes")
      .eq("user_id", user.id);
    const totalLikes = postsLikes?.reduce((acc, p) => acc + (p.likes || 0), 0) || 0;
    const { count: notesCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "note");
    const { count: questionsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "question");
    const { count: groupsCount } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setStats({
      posts: postsCount || 0,
      comments: commentsCount || 0,
      likesReceived: totalLikes,
      notes: notesCount || 0,
      questions: questionsCount || 0,
      groupsJoined: groupsCount || 0,
    });
  };

  const fetchRecentActivity = async () => {
    if (!user) return;
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("id, title, created_at, type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    const { data: recentComments } = await supabase
      .from("comments")
      .select("id, content, created_at, post_id, posts(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const activities = [
      ...(recentPosts || []).map(p => ({ ...p, activityType: "post" })),
      ...(recentComments || []).map(c => ({ ...c, activityType: "comment" })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
    setRecentActivity(activities);
  };

  const fetchAchievements = async () => {
    if (!user) return;
    const points = profile?.points || 0;
    const achievementsList = [];
    if (points >= 50) achievementsList.push({ id: 1, name: "Rising Star", icon: Star, color: "text-amber-500", bg: "bg-amber-50", unlocked: true });
    else achievementsList.push({ id: 1, name: "Rising Star", icon: Star, color: "text-slate-400", bg: "bg-slate-50", unlocked: false, requirement: "50 points" });
    
    if (stats.posts >= 5) achievementsList.push({ id: 2, name: "Content Creator", icon: FileText, color: "text-blue-500", bg: "bg-blue-50", unlocked: true });
    else achievementsList.push({ id: 2, name: "Content Creator", icon: FileText, color: "text-slate-400", bg: "bg-slate-50", unlocked: false, requirement: "5 posts" });
    
    if (stats.comments >= 10) achievementsList.push({ id: 3, name: "Helper", icon: MessageSquare, color: "text-green-500", bg: "bg-green-50", unlocked: true });
    else achievementsList.push({ id: 3, name: "Helper", icon: MessageSquare, color: "text-slate-400", bg: "bg-slate-50", unlocked: false, requirement: "10 comments" });
    
    if (stats.likesReceived >= 20) achievementsList.push({ id: 4, name: "Popular", icon: Heart, color: "text-rose-500", bg: "bg-rose-50", unlocked: true });
    else achievementsList.push({ id: 4, name: "Popular", icon: Heart, color: "text-slate-400", bg: "bg-slate-50", unlocked: false, requirement: "20 likes" });
    
    if (points >= 200) achievementsList.push({ id: 5, name: "Scholar", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-50", unlocked: true });
    else achievementsList.push({ id: 5, name: "Scholar", icon: BookOpen, color: "text-slate-400", bg: "bg-slate-50", unlocked: false, requirement: "200 points" });

    setAchievements(achievementsList);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name,
        college: editForm.college,
        class_year: editForm.class_year,
        bio: editForm.bio,
      })
      .eq("id", user.id);
    await refreshProfile();
    setIsEditing(false);
    setSaving(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const tabVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: { opacity: 1, scale: 1 },
  };

  if (!user) return null;

  return (
    <div className="pb-4">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mb-6"
      >
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-b-3xl" />
        <div className="absolute -bottom-10 left-4 flex items-end gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white">
              {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border hover:scale-110 transition"
            >
              <Camera className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
          <div className="mb-2">
            <h2 className="text-xl font-bold text-slate-800">{profile?.full_name || "Student"}</h2>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Points Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-12 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-full">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-700">{profile?.points || 0}</p>
            <p className="text-xs text-amber-600">Total Points</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-amber-700">Rank #{leaderboard.findIndex(u => u.id === user.id) + 1 || "N/A"}</p>
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Top {Math.round((leaderboard.findIndex(u => u.id === user.id) + 1) / leaderboard.length * 100)}%
          </p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mt-6 mb-4 p-1 bg-white/70 backdrop-blur-sm rounded-xl border">
        {[
          { id: "overview", label: "Overview", icon: UserIcon },
          { id: "activity", label: "Activity", icon: Clock },
          { id: "achievements", label: "Achievements", icon: Award },
          { id: "settings", label: "Settings", icon: Settings },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            variants={tabVariants}
            animate={activeSection === tab.id ? "active" : "inactive"}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition ${
              activeSection === tab.id
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {activeSection === "overview" && (
          <motion.div key="overview" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
            {/* Bio */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-2">About</h3>
              <p className="text-sm text-slate-600">{profile?.bio || "No bio yet. Tell us about yourself!"}</p>
              <div className="flex flex-wrap gap-4 mt-3">
                {profile?.college && (
                  <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.college}</span>
                )}
                {profile?.class_year && (
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Class of {profile.class_year}</span>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-xl border text-center">
                <FileText className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800">{stats.posts}</p>
                <p className="text-xs text-slate-500">Posts</p>
              </div>
              <div className="bg-white p-3 rounded-xl border text-center">
                <MessageSquare className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800">{stats.comments}</p>
                <p className="text-xs text-slate-500">Comments</p>
              </div>
              <div className="bg-white p-3 rounded-xl border text-center">
                <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800">{stats.likesReceived}</p>
                <p className="text-xs text-slate-500">Likes</p>
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard
                </h3>
                <button className="text-xs text-indigo-600 flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {leaderboard.slice(0, 5).map((u, i) => (
                <div key={u.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-100"
                    }`}>{i + 1}</span>
                    <span className="text-sm">{u.full_name || u.email}</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{u.points} pts</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === "activity" && (
          <motion.div key="activity" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-3">
            <h3 className="font-semibold text-slate-800">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent activity.</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl border flex items-start gap-3">
                  {item.activityType === "post" ? (
                    <FileText className="w-4 h-4 text-indigo-500 mt-0.5" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-green-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {item.activityType === "post" ? "Created a post" : "Commented on"} 
                      {item.activityType === "comment" && <span className="font-normal"> "{item.posts?.title}"</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.activityType === "post" && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-1">{item.title}</p>
                    )}
                    {item.activityType === "comment" && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-1">{item.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeSection === "achievements" && (
          <motion.div key="achievements" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
            <h3 className="font-semibold text-slate-800 mb-3">Achievements</h3>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <div key={ach.id} className={`${ach.bg} p-4 rounded-xl border ${ach.unlocked ? "" : "opacity-60"}`}>
                  <ach.icon className={`w-6 h-6 ${ach.color} mb-2`} />
                  <p className="font-medium text-sm">{ach.name}</p>
                  {!ach.unlocked && (
                    <p className="text-xs text-slate-500 mt-1">{ach.requirement}</p>
                  )}
                  {ach.unlocked && (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-sm text-indigo-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Keep engaging to unlock more achievements!
              </p>
            </div>
          </motion.div>
        )}

        {activeSection === "settings" && (
          <motion.div key="settings" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-3">
            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-semibold text-slate-800 mb-3">Account Settings</h3>
              <button className="w-full flex items-center justify-between py-3 border-b">
                <span className="flex items-center gap-3"><Bell className="w-5 h-5 text-slate-500" /> Notifications</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between py-3 border-b">
                <span className="flex items-center gap-3"><Lock className="w-5 h-5 text-slate-500" /> Privacy</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between py-3 border-b">
                <span className="flex items-center gap-3"><Shield className="w-5 h-5 text-slate-500" /> Security</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center justify-between py-3"
              >
                <span className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-slate-500" /> : <Sun className="w-5 h-5 text-slate-500" />}
                  Dark Mode
                </span>
                <div className={`w-10 h-5 rounded-full transition ${darkMode ? "bg-indigo-600" : "bg-slate-300"} relative`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition ${darkMode ? "translate-x-5" : ""}`} />
                </div>
              </button>
            </div>

            {/* Push Notifications Section */}
            <div className="bg-white rounded-xl p-4 border">
              <h3 className="font-semibold text-slate-800 mb-3">Push Notifications</h3>
              <PushNotificationManager />
            </div>

            <button
              onClick={signOut}
              className="w-full bg-white p-4 rounded-xl border border-red-200 text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)}><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Full Name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-slate-50"
                />
                <input
                  placeholder="College"
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-slate-50"
                />
                <input
                  placeholder="Class Year"
                  value={editForm.class_year}
                  onChange={(e) => setEditForm({ ...editForm, class_year: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-slate-50"
                />
                <textarea
                  placeholder="Bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full p-3 border rounded-xl bg-slate-50"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
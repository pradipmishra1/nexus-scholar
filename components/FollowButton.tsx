"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

export default function FollowButton({ userId }: { userId: string }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.id === userId) return;
    const checkFollow = async () => {
      const { data } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .single();
      setIsFollowing(!!data);
      setLoading(false);
    };
    checkFollow();
  }, [user, userId]);

  const toggleFollow = async () => {
    if (!user) return;
    setLoading(true);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
    }
    setIsFollowing(!isFollowing);
    setLoading(false);
  };

  if (!user || user.id === userId) return null;
  if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;

  return (
    <button
      onClick={toggleFollow}
      className={`text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1 ${
        isFollowing ? "bg-slate-100 text-slate-700" : "bg-indigo-600 text-white"
      }`}
    >
      {isFollowing ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
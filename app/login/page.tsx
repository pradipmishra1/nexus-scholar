"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/home");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 flex items-center justify-center gap-1">
            <BookOpen className="w-7 h-7" /> Nexus Scholar
          </h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md border">
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-xl" />
            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-xl" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium">{loading ? "Logging in..." : "Log In"}</button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">Don't have an account? <Link href="/signup" className="text-indigo-600">Sign up</Link></p>
        </div>
      </div>
    </main>
  );
}
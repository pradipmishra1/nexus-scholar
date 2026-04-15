"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, FileText, Users, User } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/explore", icon: Search, label: "Explore" },
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 shadow-2xl z-50">
      <div className="max-w-md mx-auto flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/home" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
              {isActive && (
                <motion.span
                  layoutId="activeTab"
                  className="absolute -bottom-2 w-1 h-1 bg-indigo-600 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
"use client";

import { useState } from "react";
import { Bell, LogOut, Mail, Search, UserCircle2, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import NotificationDropdown from "@/components/NotificationDropdown";

export default function Navbar({ userName = "Admin" }: { userName?: string }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="navbar sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher projets, messages, competences..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="ml-4 flex items-center gap-2">
        <button className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
          <Mail size={20} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">3</span>
        </button>
        <NotificationDropdown />

        {/* User avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 transition hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
              {userName?.split(" ").map(s => s[0]).join("").slice(0, 2) || "AD"}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{userName}</span>
            <ChevronDown size={14} className={`hidden text-slate-400 transition sm:block ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700">
                  <UserCircle2 size={16} /> Mon profil
                </Link>
                <hr className="mx-3 my-1.5 border-slate-100" />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

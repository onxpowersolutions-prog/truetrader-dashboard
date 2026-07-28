"use client";

import React from "react";
import Image from "next/image";
import {
  Video,
  MessageSquare,
  Radio,
  BookOpen,
  LayoutDashboard,
  Plus,
  Share2,
  Wifi,
  UserCheck,
  User,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export type ActiveTab =
  | "overview"
  | "conference"
  | "chat"
  | "announcements"
  | "architecture";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeRoomTitle: string;
  activeRoomId: string;
  isHostMode: boolean;
  setIsHostMode: (host: boolean) => void;
  latency: number;
  isOnline: boolean;
  onOpenNetworkModal: () => void;
  onOpenCreateRoomModal: () => void;
  onOpenInviteModal: () => void;
  unreadChatCount: number;
  unreadAnnouncements: number;
}

export function Header({
  activeTab,
  setActiveTab,
  activeRoomTitle,
  activeRoomId,
  isHostMode,
  setIsHostMode,
  latency,
  isOnline,
  onOpenNetworkModal,
  onOpenCreateRoomModal,
  onOpenInviteModal,
  unreadChatCount,
  unreadAnnouncements,
}: HeaderProps) {
  const getLatencyColor = (lat: number) => {
    if (!isOnline) return "bg-red-500/20 text-red-400 border-red-500/40";
    if (lat < 40) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (lat < 100) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-red-500/15 text-red-400 border-red-500/30";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#c9a84c]/20 bg-[#0b0e1a]/95 backdrop-blur-md shadow-xl shadow-black/40">
      {/* Gold accent top line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

      {/* Top tier: brand & actions */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">

        {/* ── True Trader Logo & Name ── */}
        <div className="flex items-center gap-3">
          {/* Logo circle */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#d4af37]/60 shadow-lg shadow-[#d4af37]/20 bg-[#0f1628]">
            <Image
              src="/images/truetrader-logo.png"
              alt="True Trader Logo"
              width={48}
              height={48}
              className="h-full w-full object-cover rounded-full"
              priority
            />
          </div>

          {/* Brand text */}
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-extrabold tracking-wide"
                style={{
                  background: "linear-gradient(90deg, #f0d060 0%, #d4af37 45%, #c8921a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "0.06em",
                }}
              >
                TRUE TRADER
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2 py-0.5 text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">
                <TrendingUp className="h-3 w-3" /> Live Dashboard
              </span>
              <span
                className="hidden lg:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300"
                title="Security: All clients are invisible to each other. Only True Trader Admin can monitor all connected clients."
              >
                🛡️ Privacy Shield
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px] sm:max-w-xs">
              <span className="text-[#d4af37]/70 font-medium">Room:</span>{" "}
              <span className="text-slate-300">{activeRoomTitle}</span>
            </p>
          </div>
        </div>

        {/* ── Right: actions ── */}
        <div className="flex items-center gap-2">
          {/* Latency / connectivity badge */}
          <button
            onClick={onOpenNetworkModal}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 ${getLatencyColor(latency)}`}
            title="Click to run connectivity diagnostics"
          >
            <Wifi className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Latency:</span>
            {latency} ms
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isOnline ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
            </span>
          </button>

          {/* Host / Guest mode switcher */}
          <div className="hidden md:flex items-center rounded-xl border border-[#d4af37]/20 bg-[#0f1628]/80 p-1">
            <button
              onClick={() => setIsHostMode(true)}
              title="True Trader Admin — See all online clients & counts"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                isHostMode
                  ? "text-[#0b0e1a] shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              style={
                isHostMode
                  ? { background: "linear-gradient(90deg, #d4af37, #c8921a)" }
                  : {}
              }
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Admin (Host)</span>
            </button>
            <button
              onClick={() => setIsHostMode(false)}
              title="Guest (Client) — Invisible to other clients; only True Trader is visible"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                !isHostMode
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Guest (Private)</span>
            </button>
          </div>

          {/* Invite / Share */}
          <button
            onClick={onOpenInviteModal}
            className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 px-3 py-1.5 text-xs font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/15"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share & QR</span>
          </button>

          {/* Create room */}
          <button
            onClick={onOpenCreateRoomModal}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-[#0b0e1a] shadow-md transition hover:opacity-90"
            style={{ background: "linear-gradient(90deg, #d4af37, #b8860b)" }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Room</span>
          </button>
        </div>
      </div>

      {/* ── Navigation tabs ── */}
      <div className="border-t border-[#d4af37]/10 bg-[#080b14]/80">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6">

          {[
            {
              id: "overview" as ActiveTab,
              label: "Dashboard Home",
              icon: <LayoutDashboard className="h-4 w-4" />,
              accent: "text-[#d4af37]",
            },
            {
              id: "conference" as ActiveTab,
              label: "Live Call",
              icon: <Video className="h-4 w-4" />,
              accent: "text-emerald-400",
            },
            {
              id: "chat" as ActiveTab,
              label: "Group Chat",
              icon: <MessageSquare className="h-4 w-4" />,
              accent: "text-sky-400",
              badge: unreadChatCount,
            },
            {
              id: "announcements" as ActiveTab,
              label: "Announcements",
              icon: <Radio className="h-4 w-4" />,
              accent: "text-amber-400",
              badge: unreadAnnouncements,
            },
            {
              id: "architecture" as ActiveTab,
              label: "Architecture & Guide",
              icon: <BookOpen className="h-4 w-4" />,
              accent: "text-purple-400",
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#d4af37] shadow-sm shadow-[#d4af37]/10"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <span className={isActive ? "text-[#d4af37]" : tab.accent}>
                  {tab.icon}
                </span>
                {tab.label}
                {tab.badge && tab.badge > 0 ? (
                  <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37] text-[10px] font-bold text-[#0b0e1a]">
                    {tab.badge}
                  </span>
                ) : null}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37] to-[#d4af37]/0" />
                )}
              </button>
            );
          })}

          {/* Mobile host toggle */}
          <div className="ml-auto flex md:hidden items-center">
            <button
              onClick={() => setIsHostMode(!isHostMode)}
              className="rounded-lg px-2.5 py-1 text-[11px] font-bold border"
              style={
                isHostMode
                  ? { background: "linear-gradient(90deg,#d4af37,#b8860b)", color: "#0b0e1a", borderColor: "#d4af37" }
                  : { background: "transparent", color: "#94a3b8", borderColor: "#334155" }
              }
            >
              {isHostMode ? "ADMIN" : "GUEST"}
            </button>
          </div>
        </nav>
      </div>

      {/* Gold accent bottom line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
    </header>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Video,
  Users,
  Lock,
  Plus,
  Share2,
  Radio,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
  Globe,
  TrendingUp,
  BarChart2,
  MessageSquare,
  BookOpen,
  Mic,
} from "lucide-react";
import { Room } from "@/db/schema";
import { ActiveTab } from "./Header";

interface DashboardHomeProps {
  rooms: (Room & { activeCount: number })[];
  currentRoomId: string;
  onSelectRoom: (roomId: string) => void;
  isHostMode: boolean;
  onOpenCreateRoom: () => void;
  onOpenInvite: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  recentAnnouncements: any[];
}

export function DashboardHome({
  rooms,
  currentRoomId,
  onSelectRoom,
  isHostMode,
  onOpenCreateRoom,
  onOpenInvite,
  onNavigateTab,
  recentAnnouncements,
}: DashboardHomeProps) {
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleCustomJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInput.trim()) {
      setJoinError("Please enter a Meeting Room ID or invitation URL.");
      return;
    }
    setJoinError("");
    let target = joinInput.trim();
    if (target.includes("?room=")) {
      const match = target.match(/\?room=([^&]+)/);
      if (match && match[1]) target = decodeURIComponent(match[1]);
    } else if (target.includes("/room/")) {
      const parts = target.split("/");
      target = parts[parts.length - 1];
    }
    onSelectRoom(target);
    onNavigateTab("conference");
  };

  const currentRoom = rooms.find((r) => r.roomId === currentRoomId) || rooms[0];

  return (
    <div className="space-y-8 pb-16">

      {/* ── Hero Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/25 bg-gradient-to-br from-[#0f1628] via-[#0b1020] to-[#080b14] p-7 sm:p-10 shadow-2xl">
        {/* Background decorative glow blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d4af37]/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[#b8860b]/8 blur-3xl" />

        {/* Faint concentric ring behind logo */}
        <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-5 hidden lg:block">
          <div className="h-64 w-64 rounded-full border-4 border-[#d4af37]" />
          <div className="absolute inset-4 rounded-full border-2 border-[#d4af37]" />
          <div className="absolute inset-10 rounded-full border border-[#d4af37]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Left content */}
          <div className="max-w-2xl space-y-4">
            {/* Logo + brand name inline */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#d4af37]/60 bg-[#0b0e1a] shadow-xl shadow-[#d4af37]/15 overflow-hidden">
                <Image
                  src="/images/truetrader-logo.png"
                  alt="True Trader"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover rounded-full"
                />
              </div>
              <div>
                <h2
                  className="text-2xl sm:text-3xl font-extrabold tracking-wide"
                  style={{
                    background: "linear-gradient(90deg,#f0d060 0%,#d4af37 50%,#c8921a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  TRUE TRADER
                </h2>
                <p className="text-xs text-[#d4af37]/70 font-medium tracking-widest uppercase">
                  Interactive Communication Dashboard
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isHostMode ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-[#d4af37] uppercase">
                  <UserCheck className="h-3.5 w-3.5" /> Admin / True Trader Host
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-300">
                  <Sparkles className="h-3.5 w-3.5" /> Welcome, Guest Trader
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live & Online
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isHostMode
                ? "Welcome back, True Trader Host. Monitor all connected clients, broadcast announcements, manage rooms, and run live video sessions with full Admin oversight."
                : "Connect with True Trader over the internet. Join a live video & audio call, chat privately with the host, and receive real-time trading announcements."}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab("conference")}
              className="flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-bold text-[#0b0e1a] shadow-xl transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#f0d060,#d4af37,#b8860b)" }}
            >
              <Video className="h-5 w-5" />
              <span>Enter Live Call Room</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onOpenCreateRoom}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/5 px-5 py-4 font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/10"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Security & Confidentiality Notice ── */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border p-4 ${
          isHostMode
            ? "border-[#d4af37]/40 bg-[#d4af37]/5"
            : "border-emerald-500/30 bg-emerald-500/5"
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isHostMode ? "bg-[#d4af37]/15 text-[#d4af37]" : "bg-emerald-500/15 text-emerald-400"}`}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-white text-sm">
                {isHostMode
                  ? "🛡️ Admin Security Policy: Full Client Monitoring Active"
                  : "🔒 Privacy Shield: Clients Are Completely Invisible to Each Other"}
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isHostMode ? "bg-[#d4af37] text-[#0b0e1a]" : "bg-emerald-500 text-slate-950"}`}>
                {isHostMode ? "Admin Mode" : "Guest Mode"}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {isHostMode
                ? "You are logged in as True Trader Admin. You can see all connected clients, their video/audio streams, online counts, and private messages."
                : "For full client confidentiality, you cannot see other online clients, how many are connected, or their messages. You only see & interact with True Trader (Admin/Host)."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Rooms + Quick Join ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active rooms list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Active Trading Rooms</h2>
              <p className="text-xs text-slate-400">Select a room to join the live call or group chat</p>
            </div>
            <button
              onClick={onOpenCreateRoom}
              className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 px-3 py-1.5 text-xs font-semibold text-[#d4af37] hover:bg-[#d4af37]/10 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add Room
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rooms.map((room) => {
              const isActive = room.roomId === currentRoomId;
              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.roomId)}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition cursor-pointer ${
                    isActive
                      ? "border-[#d4af37]/60 bg-[#0f1628] shadow-lg shadow-[#d4af37]/10 ring-1 ring-[#d4af37]/30"
                      : "border-slate-800 bg-[#0d1020]/60 hover:border-[#d4af37]/30 hover:bg-[#0f1628]"
                  }`}
                >
                  {/* Active room gold indicator */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300">
                        {room.isLocked ? (
                          <><Lock className="h-3 w-3 text-[#d4af37]" /> Locked</>
                        ) : (
                          <><Globe className="h-3 w-3 text-emerald-400" /> Open</>
                        )}
                      </span>
                      {isActive && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-[#0b0e1a] uppercase" style={{ background: "linear-gradient(90deg,#d4af37,#b8860b)" }}>
                          Active
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-white text-base group-hover:text-[#d4af37] transition">
                      {room.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{room.description}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    {/* Client count: only shown to Admin */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {isHostMode ? (
                        <>
                          <Users className="h-4 w-4 text-[#d4af37]" />
                          <span>
                            <strong className="text-white">{room.activeCount}</strong> client{room.activeCount === 1 ? "" : "s"} online
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-300 font-medium">Host Available • Clients Hidden</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRoom(room.roomId);
                        onNavigateTab("conference");
                      }}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition text-[#0b0e1a] group-hover:scale-105"
                      style={{ background: "linear-gradient(90deg,#d4af37,#b8860b)" }}
                    >
                      <span>Join Call</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Join + Latest Announcement */}
        <div className="space-y-6">
          {/* Join via link */}
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0f1628] p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-white text-base">Join via Meeting Link</h3>
              <p className="text-xs text-slate-400">Enter an invitation URL or Room ID</p>
            </div>
            <form onSubmit={handleCustomJoin} className="space-y-3">
              {joinError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {joinError}
                </div>
              )}
              <input
                type="text"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="e.g. connect-alex-main or paste URL"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#d4af37] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[#0b0e1a] transition hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#d4af37,#b8860b)" }}
              >
                <span>Connect & Enter Room</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {currentRoom && (
              <div className="border-t border-slate-800/80 pt-3">
                <button
                  onClick={onOpenInvite}
                  className="w-full flex items-center justify-center gap-2 text-xs text-[#d4af37] hover:text-[#f0d060] font-medium"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share Room ID: <strong>{currentRoom.roomId}</strong></span>
                </button>
              </div>
            )}
          </div>

          {/* Latest Pinned Announcement */}
          {recentAnnouncements && recentAnnouncements.length > 0 && (
            <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/8 to-[#0f1628]/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                  <Radio className="h-3.5 w-3.5" /> Latest Broadcast
                </span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-[#0b0e1a]" style={{ background: "linear-gradient(90deg,#d4af37,#b8860b)" }}>
                  PINNED
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">{recentAnnouncements[0].title}</h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3">{recentAnnouncements[0].content}</p>
              </div>
              <button
                onClick={() => onNavigateTab("announcements")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#d4af37] hover:text-[#f0d060] transition"
              >
                <span>View all announcements & voice notes</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Feature Navigation Grid ── */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Core Communication Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              tab: "conference" as ActiveTab,
              icon: <Video className="h-6 w-6" />,
              title: "Live Video & Audio Calling",
              desc: "Google Meet-like multi-peer conferencing with mic mute, camera toggle, and screen sharing.",
              color: "text-emerald-400 bg-emerald-500/10",
            },
            {
              tab: "conference" as ActiveTab,
              icon: <Zap className="h-6 w-6" />,
              title: "Screen Sharing",
              desc: "Present your browser, window, or full desktop in HD with getDisplayMedia.",
              color: "text-sky-400 bg-sky-500/10",
            },
            {
              tab: "chat" as ActiveTab,
              icon: <MessageSquare className="h-6 w-6" />,
              title: "Private Group Chat",
              desc: "Instant messaging with emoji reactions, quote replies, and file attachments.",
              color: "text-indigo-400 bg-indigo-500/10",
            },
            {
              tab: "announcements" as ActiveTab,
              icon: <Radio className="h-6 w-6" />,
              title: "Announcement Channel",
              desc: "Host broadcasts with priority badges, pinned alerts, and audio voice notes.",
              color: "text-[#d4af37] bg-[#d4af37]/10",
            },
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => onNavigateTab(item.tab)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#0d1020]/60 p-5 transition hover:border-[#d4af37]/30 hover:bg-[#0f1628]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl mb-3 group-hover:scale-110 transition ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="font-semibold text-white text-base group-hover:text-[#d4af37] transition">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer watermark ── */}
      <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800/50">
        <div className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden border border-[#d4af37]/30">
          <Image src="/images/truetrader-logo.png" alt="TT" width={28} height={28} className="object-cover" />
        </div>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()}{" "}
          <span className="text-[#d4af37]/80 font-semibold">True Trader</span> — All Rights Reserved
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  Users,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  LayoutGrid,
  Square,
  Radio,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  Share2,
  RefreshCw,
} from "lucide-react";
import { Participant } from "@/db/schema";
import { playCallJoinSound } from "@/lib/sound";

interface VideoConferenceProps {
  roomId: string;
  roomTitle: string;
  currentUserId: string;
  currentUserName: string;
  isHost: boolean;
  participants: Participant[];
  onUpdateMyState: (data: {
    isMuted?: boolean;
    isVideoOff?: boolean;
    isScreenSharing?: boolean;
  }) => Promise<void>;
  onOpenChatSidebar: () => void;
  onOpenInviteModal: () => void;
  isOnline: boolean;
  latency: number;
}

export function VideoConference({
  roomId,
  roomTitle,
  currentUserId,
  currentUserName,
  isHost,
  participants,
  onUpdateMyState,
  onOpenChatSidebar,
  onOpenInviteModal,
  isOnline,
  latency,
}: VideoConferenceProps) {
  // Local Media states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVirtualDemoMode, setIsVirtualDemoMode] = useState(false);

  // Layout state: 'grid' | 'spotlight'
  const [layoutMode, setLayoutMode] = useState<"grid" | "spotlight">("grid");
  const [spotlightParticipantId, setSpotlightParticipantId] =
    useState<string | null>(null);

  // Participant drawer
  const [isParticipantDrawerOpen, setIsParticipantDrawerOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // References to MediaStreams and HTMLVideoElements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Audio visualizer level
  const [audioLevel, setAudioLevel] = useState(30);

  // Start call timer and subtle audio visualizer simulation when unmuted
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    const levelInterval = setInterval(() => {
      if (!isMuted) {
        setAudioLevel(Math.floor(Math.random() * 60 + 25));
      } else {
        setAudioLevel(0);
      }
    }, 400);

    return () => {
      clearInterval(timer);
      clearInterval(levelInterval);
    };
  }, [isMuted]);

  // Request real getUserMedia on mount
  useEffect(() => {
    let mounted = true;
    async function initCamera() {
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (!mounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setIsVirtualDemoMode(false);
          playCallJoinSound();
        }
      } catch (err) {
        console.warn(
          "Camera/Mic permission not granted or hardware missing. Using Virtual Demo mode."
        );
        setIsVirtualDemoMode(true);
      }
    }
    initCamera();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId]);

  // Handle Mute toggle
  const handleToggleMute = async () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextVal;
      });
    }
    await onUpdateMyState({ isMuted: nextVal });
  };

  // Handle Video toggle
  const handleToggleVideo = async () => {
    const nextVal = !isVideoOff;
    setIsVideoOff(nextVal);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !nextVal;
      });
    }
    await onUpdateMyState({ isVideoOff: nextVal });
  };

  // Handle Screen Share via getDisplayMedia
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      setLayoutMode("grid");
      await onUpdateMyState({ isScreenSharing: false });
    } else {
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices) {
          const screenStream =
            await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true,
            });
          screenStreamRef.current = screenStream;
          setIsScreenSharing(true);
          setLayoutMode("spotlight");
          setSpotlightParticipantId(currentUserId);

          // Handle when user clicks browser's native "Stop Sharing" floating button
          screenStream.getVideoTracks()[0].onended = async () => {
            setIsScreenSharing(false);
            screenStreamRef.current = null;
            setLayoutMode("grid");
            await onUpdateMyState({ isScreenSharing: false });
          };

          if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = screenStream;
          }
          await onUpdateMyState({ isScreenSharing: true });
        }
      } catch (err) {
        console.warn("Screen share cancelled by user or error:", err);
      }
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  // Privacy Security Rule: Only Admin/Host can see all clients. Clients only see Admin/Host and themselves.
  const visibleParticipants = isHost
    ? participants
    : participants.filter((p) => p.role === "host" || p.id === currentUserId);

  // Determine who to display in spotlight
  const screenSharer = visibleParticipants.find((p) => p.isScreenSharing);
  const displaySpotlightId =
    spotlightParticipantId || screenSharer?.id || currentUserId;

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[580px] w-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Privacy Shield & Security Notice Banner */}
      <div
        className={`flex items-center justify-between px-6 py-2 text-xs font-medium border-b ${
          isHost
            ? "bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {isHost
              ? `🛡️ Admin Security Mode: You can monitor all ${participants.length} online client(s). Clients cannot see each other.`
              : "🔒 Security Shield Active: All clients are invisible to each other. You can only see & interact with Admin/Host."}
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase">
          {isHost ? "Admin Visible" : "Client Protected"}
        </span>
      </div>

      {/* Top conference info bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <h2 className="font-semibold text-white text-sm sm:text-base truncate max-w-[220px] sm:max-w-md">
              {roomTitle}
            </h2>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
            {formatDuration(callDuration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Virtual demo mode badge toggle */}
          <button
            onClick={() => setIsVirtualDemoMode(!isVirtualDemoMode)}
            className={`hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition border ${
              isVirtualDemoMode
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle Virtual Camera mode for users without webcam permissions"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isVirtualDemoMode ? "Virtual Camera: ON" : "Real Webcam: ON"}</span>
          </button>

          {/* Layout mode switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1">
            <button
              onClick={() => setLayoutMode("grid")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition ${
                layoutMode === "grid"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setLayoutMode("spotlight")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition ${
                layoutMode === "spotlight"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Spotlight</span>
            </button>
          </div>

          {/* Share room invite */}
          <button
            onClick={onOpenInviteModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Share2 className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/80">
        {layoutMode === "spotlight" || isScreenSharing || screenSharer ? (
          /* Spotlight / Presenter Mode */
          <div className="grid h-full grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Primary Spotlight Tile (3 columns) */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden relative shadow-xl">
              {isScreenSharing && screenStreamRef.current ? (
                <video
                  ref={screenShareVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-contain bg-black"
                />
              ) : screenSharer ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 p-8 text-center">
                  <MonitorUp className="h-16 w-16 text-sky-400 animate-pulse" />
                  <h3 className="mt-4 text-lg font-bold text-white">
                    {screenSharer.name} is Sharing Screen
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    WebRTC getDisplayMedia HD Stream • 60 FPS
                  </p>
                </div>
              ) : (
                /* Spotlight speaker */
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-slate-800 border-2 border-sky-500/50 shadow-2xl">
                    <img
                      src={
                        participants.find((p) => p.id === displaySpotlightId)?.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                      }
                      alt="Spotlight Avatar"
                      className="h-full w-full rounded-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Mic className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">
                    {participants.find((p) => p.id === displaySpotlightId)?.name ||
                      "Alex Rivera (Host)"}
                  </h3>
                  <span className="mt-1 rounded-full bg-sky-500/10 px-3 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
                    Spotlight Speaker
                  </span>
                </div>
              )}

              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-white border border-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>
                  {isScreenSharing ? "You are Sharing Screen" : "Active Spotlight View"}
                </span>
              </div>
            </div>

            {/* Sidebar thumbnails (1 column) */}
            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-full">
              {/* Local User Tile */}
              <div className="relative flex-shrink-0 h-36 lg:h-44 w-52 lg:w-full rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
                {!isVirtualDemoMode && !isVideoOff && localStreamRef.current ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg">
                      <span className="text-base font-bold">
                        {currentUserName.charAt(0)}
                      </span>
                    </div>
                    <span className="mt-2 text-xs font-medium text-white">
                      {currentUserName} (You)
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2 py-1 text-[11px] font-medium text-white">
                  <span>You</span>
                  {isMuted ? (
                    <MicOff className="h-3 w-3 text-red-400" />
                  ) : (
                    <Mic className="h-3 w-3 text-emerald-400" />
                  )}
                </div>
              </div>

              {/* Other Visible Participants */}
              {visibleParticipants.map((p) => {
                if (p.id === currentUserId) return null;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSpotlightParticipantId(p.id)}
                    className="relative flex-shrink-0 h-36 lg:h-44 w-52 lg:w-full cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg transition hover:border-sky-500/50"
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                      <img
                        src={
                          p.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            p.name
                          )}`
                        }
                        alt={p.name}
                        className="h-14 w-14 rounded-full object-cover border border-slate-700"
                      />
                      <span className="mt-2 text-xs font-medium text-white truncate max-w-[140px]">
                        {p.name}
                      </span>
                      {p.role === "host" && (
                        <span className="mt-0.5 text-[10px] text-amber-400 font-semibold">
                          Host
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2 py-1 text-[11px] font-medium text-white">
                      <span className="truncate max-w-[90px]">{p.name}</span>
                      {p.isMuted ? (
                        <MicOff className="h-3 w-3 text-red-400" />
                      ) : (
                        <Mic className="h-3 w-3 text-emerald-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Automatic Google Meet-style Grid Mode */
          <div className="grid h-full w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Local Video Card */}
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl transition hover:border-slate-700">
              {!isVirtualDemoMode && !isVideoOff && localStreamRef.current ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl">
                      <span className="text-2xl font-bold">
                        {currentUserName.charAt(0)}
                      </span>
                    </div>
                    {/* Audio talking waveform animation when not muted */}
                    {!isMuted && (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Mic className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-white text-base">
                    {currentUserName} (You)
                  </h3>
                  <span className="mt-0.5 text-xs text-slate-400">
                    {isVirtualDemoMode
                      ? "Virtual Demo Avatar • WebRTC P2P"
                      : "Local Camera Off"}
                  </span>
                </div>
              )}

              {/* Top badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                {isHost && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    <UserCheck className="h-3 w-3" /> HOST
                  </span>
                )}
                {isScreenSharing && (
                  <span className="flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-500/40 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                    <MonitorUp className="h-3 w-3" /> SHARING
                  </span>
                )}
              </div>

              {/* Bottom name and state bar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-slate-950/80 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-white border border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <span>{currentUserName} (You)</span>
                </div>
                <div className="flex items-center gap-2">
                  {isMuted ? (
                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                      <MicOff className="h-3.5 w-3.5" /> Muted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Mic className="h-3.5 w-3.5" /> Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Other Visible Remote Participants Cards */}
            {visibleParticipants.map((p) => {
              if (p.id === currentUserId) return null;
              return (
                <div
                  key={p.id}
                  className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl transition hover:border-slate-700"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                    <div className="relative">
                      <img
                        src={
                          p.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            p.name
                          )}`
                        }
                        alt={p.name}
                        className="h-20 w-20 rounded-full object-cover border-2 border-slate-700 shadow-xl"
                      />
                      {!p.isMuted && (
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Mic className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 font-semibold text-white text-base truncate max-w-[200px]">
                      {p.name}
                    </h3>
                    <span className="mt-0.5 text-xs text-slate-400">
                      {p.role === "host" ? "Host & Moderator" : "Guest Participant"}
                    </span>
                  </div>

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {p.role === "host" && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                        <UserCheck className="h-3 w-3" /> HOST
                      </span>
                    )}
                    {p.isScreenSharing && (
                      <span className="flex items-center gap-1 rounded-full bg-sky-500/20 border border-sky-500/40 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                        <MonitorUp className="h-3 w-3" /> SHARING
                      </span>
                    )}
                  </div>

                  {/* Bottom info bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-slate-950/80 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-white border border-slate-800">
                    <span className="truncate">{p.name}</span>
                    <div className="flex items-center gap-2">
                      {p.isMuted ? (
                        <MicOff className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Mic className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      {p.isVideoOff ? (
                        <VideoOff className="h-3.5 w-3.5 text-slate-500" />
                      ) : (
                        <Video className="h-3.5 w-3.5 text-sky-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Google Meet-style Bottom Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/90 px-6 py-4">
        {/* Left: Audio level and connection status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
            {!isMuted ? (
              <Mic className="h-4 w-4 text-emerald-400" />
            ) : (
              <MicOff className="h-4 w-4 text-red-400" />
            )}
            <div className="hidden sm:flex items-center gap-0.5">
              {[...Array(6)].map((_, idx) => (
                <span
                  key={idx}
                  className={`h-3 w-1 rounded-sm transition-all ${
                    !isMuted && audioLevel > idx * 10
                      ? "bg-emerald-400"
                      : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>WebRTC P2P • {latency}ms</span>
          </div>
        </div>

        {/* Center: Primary call controls */}
        <div className="flex items-center gap-2.5">
          {/* Mute / Unmute Microphone button */}
          <button
            onClick={handleToggleMute}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition shadow-lg ${
              isMuted
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {/* Toggle Video Camera button */}
          <button
            onClick={handleToggleVideo}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition shadow-lg ${
              isVideoOff
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </button>

          {/* Screen Sharing button */}
          <button
            onClick={handleToggleScreenShare}
            className={`flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold transition shadow-lg ${
              isScreenSharing
                ? "bg-sky-500 text-white hover:bg-sky-600 ring-2 ring-sky-300"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            }`}
            title="Present your screen or application window"
          >
            {isScreenSharing ? (
              <>
                <MonitorOff className="h-5 w-5" />
                <span className="hidden md:inline">Stop Sharing</span>
              </>
            ) : (
              <>
                <MonitorUp className="h-5 w-5 text-sky-400" />
                <span className="hidden md:inline">Share Screen</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Participant drawer toggle and chat sidebar */}
        <div className="flex items-center gap-2">
          {/* Toggle participant list drawer */}
          <button
            onClick={() => setIsParticipantDrawerOpen(!isParticipantDrawerOpen)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition border ${
              isParticipantDrawerOpen
                ? "bg-slate-800 text-white border-slate-600"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <Users className="h-4 w-4 text-sky-400" />
            <span>
              {isHost
                ? `Participants (${participants.length})`
                : "Participants (Host & You)"}
            </span>
          </button>

          {/* Open Chat button */}
          <button
            onClick={onOpenChatSidebar}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-3.5 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition"
          >
            <MessageSquare className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Open Chat</span>
          </button>
        </div>
      </div>

      {/* Participant List Drawer */}
      {isParticipantDrawerOpen && (
        <div className="absolute right-0 top-0 bottom-20 w-80 border-l border-slate-800 bg-slate-950/95 backdrop-blur-md p-5 z-30 shadow-2xl overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <span>
                {isHost
                  ? `In This Room (${participants.length} Total)`
                  : "In This Room (Privacy Mode)"}
              </span>
            </h3>
            <button
              onClick={() => setIsParticipantDrawerOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          {!isHost && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <p className="font-semibold mb-0.5">🔒 Confidentiality Shield</p>
              <p className="opacity-90">
                To protect client privacy, you only see the Admin/Host and yourself. Other online guests are invisible.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {visibleParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      p.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        p.name
                      )}`
                    }
                    alt={p.name}
                    className="h-9 w-9 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.role === "host" && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                          HOST
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.id === currentUserId ? "You" : "Connected"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {p.isMuted ? (
                    <MicOff className="h-4 w-4 text-red-400" />
                  ) : (
                    <Mic className="h-4 w-4 text-emerald-400" />
                  )}
                  {p.isVideoOff ? (
                    <VideoOff className="h-4 w-4 text-slate-600" />
                  ) : (
                    <Video className="h-4 w-4 text-sky-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

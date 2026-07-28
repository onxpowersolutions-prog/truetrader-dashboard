"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Radio,
  Pin,
  Mic,
  Square,
  Play,
  Pause,
  AlertTriangle,
  Sparkles,
  Volume2,
  Plus,
  Trash2,
  Check,
  Tag,
  UserCheck,
  Send,
  X,
  Clock,
  Filter,
} from "lucide-react";
import { Announcement } from "@/db/schema";
import { playNotificationChime } from "@/lib/sound";

interface AnnouncementsTabProps {
  announcements: Announcement[];
  isHostMode: boolean;
  onPostAnnouncement: (data: {
    title: string;
    content: string;
    category?: string;
    voiceUrl?: string;
    voiceDuration?: number;
    priority?: string;
    isPinned?: boolean;
    authorName?: string;
  }) => Promise<void>;
  onTogglePin: (id: number, currentPinned: boolean) => Promise<void>;
  onReaction: (id: number, emoji: string) => Promise<void>;
  onDeleteAnnouncement: (id: number) => Promise<void>;
  defaultHostName?: string;
}

export function AnnouncementsTab({
  announcements,
  isHostMode,
  onPostAnnouncement,
  onTogglePin,
  onReaction,
  onDeleteAnnouncement,
  defaultHostName = "True Trader (Admin Host)",
}: AnnouncementsTabProps) {
  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Voice Note Recorder states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{
    url: string;
    duration: number;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);

  // Audio Player states for listening to voice notes
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, []);

  // Handle Start Recording Voice Note
  const startRecording = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        alert("Audio recording is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setRecordedAudio({
            url: base64data,
            duration: recordDuration || 15,
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start voice note recording:", err);
      alert("Microphone permission denied or not found.");
    }
  };

  // Handle Stop Recording Voice Note
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordIntervalRef.current);
    }
  };

  // Handle Broadcast Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      await onPostAnnouncement({
        title: title.trim(),
        content: content.trim(),
        category: recordedAudio ? "voice_note" : category,
        voiceUrl: recordedAudio?.url,
        voiceDuration: recordedAudio?.duration,
        priority,
        isPinned,
        authorName: defaultHostName,
      });

      setTitle("");
      setContent("");
      setCategory("general");
      setPriority("normal");
      setIsPinned(false);
      setRecordedAudio(null);
      setShowBroadcastModal(false);
      playNotificationChime();
    } catch (err) {
      console.error("Failed to post announcement:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Audio Playback
  const togglePlayVoiceNote = (announcementId: number, voiceUrl: string) => {
    if (playingId === announcementId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingId(null);
      }
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(voiceUrl);
      audioPlayerRef.current = audio;
      audio.play().catch(() => {});
      setPlayingId(announcementId);

      audio.onended = () => {
        setPlayingId(null);
      };
    }
  };

  const filtered = announcements.filter((item) => {
    if (filterCategory === "all") return true;
    if (filterCategory === "pinned") return item.isPinned;
    return item.category === filterCategory;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-[11px] font-bold text-red-300">
            <AlertTriangle className="h-3 w-3" /> URGENT
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
            <Sparkles className="h-3 w-3" /> HIGH PRIORITY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
            NORMAL
          </span>
        );
    }
  };

  const formatDuration = (secs?: number | null) => {
    if (!secs) return "00:00";
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Hero Banner for Announcement Channel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Radio className="h-3.5 w-3.5" /> OFFICIAL ANNOUNCEMENT CHANNEL
            </span>
            {isHostMode && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 uppercase">
                Host Broadcast Enabled
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Live Broadcasts, Updates & Voice Notes
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Official announcements broadcasted by the Host to all connected dashboard
            users in real time.
          </p>
        </div>

        {/* Host action button */}
        {isHostMode ? (
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Broadcast Announcement</span>
          </button>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 max-w-xs">
            <UserCheck className="h-4 w-4 text-amber-400 mb-1" />
            Switch to <strong>Host (Admin)</strong> mode in the top header if you want
            to broadcast new updates or record voice notes.
          </div>
        )}
      </div>

      {/* Filter tabs bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterCategory === "all"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            All Announcements ({announcements.length})
          </button>
          <button
            onClick={() => setFilterCategory("pinned")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterCategory === "pinned"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Pin className="h-3.5 w-3.5" /> Pinned
          </button>
          <button
            onClick={() => setFilterCategory("voice_note")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterCategory === "voice_note"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Mic className="h-3.5 w-3.5" /> Voice Notes
          </button>
          <button
            onClick={() => setFilterCategory("alert")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterCategory === "alert"
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Alerts
          </button>
          <button
            onClick={() => setFilterCategory("update")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterCategory === "update"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Updates
          </button>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <Radio className="mx-auto h-12 w-12 text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-white">
              No announcements in this category
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Check back later or change your filter selection above.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            let reactionMap: Record<string, number> = {};
            try {
              reactionMap = JSON.parse(item.reactions || "{}");
            } catch (e) {
              reactionMap = {};
            }

            return (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-3xl border p-6 transition shadow-xl ${
                  item.isPinned
                    ? "border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-slate-900/80 to-slate-950"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                {/* Top header of announcement */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 font-bold shadow-sm">
                      <Radio className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {item.authorName}
                        </span>
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 uppercase">
                          Host
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.isPinned && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                        <Pin className="h-3 w-3" /> PINNED
                      </span>
                    )}
                    {getPriorityBadge(item.priority)}

                    {/* Host PIN / DELETE controls */}
                    {isHostMode && (
                      <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-800">
                        <button
                          onClick={() => onTogglePin(item.id, item.isPinned)}
                          className={`rounded-lg p-1.5 text-xs transition ${
                            item.isPinned
                              ? "bg-amber-500/20 text-amber-300"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                          title={item.isPinned ? "Unpin Announcement" : "Pin Announcement"}
                        >
                          <Pin className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteAnnouncement(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300"
                          title="Delete Announcement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title and Body */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>

                  {/* Voice Note Audio Player Card */}
                  {item.voiceUrl && (
                    <div className="my-4 overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 p-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              togglePlayVoiceNote(item.id, item.voiceUrl!)
                            }
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-400 transition"
                          >
                            {playingId === item.id ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6 ml-0.5" />
                            )}
                          </button>
                          <div>
                            <div className="font-semibold text-white text-sm flex items-center gap-2">
                              <span>Host Voice Note</span>
                              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                                {formatDuration(item.voiceDuration)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 mt-0.5">
                              {playingId === item.id
                                ? "Playing Host Voice Broadcast..."
                                : "Click play to listen to Alex's voice note"}
                            </div>
                          </div>
                        </div>

                        {/* Interactive audio waveform bars animation */}
                        <div className="flex items-center gap-1">
                          {[25, 40, 65, 80, 50, 30, 75, 45, 60, 35].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full transition-all ${
                                playingId === item.id
                                  ? "bg-sky-400 animate-pulse"
                                  : "bg-slate-700"
                              }`}
                              style={{ height: `${Math.max(12, h * 0.4)}px` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </div>
                </div>

                {/* Footer Emoji Reactions Bar */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {["👍", "❤️", "🔥", "🚀", "👏", "💡"].map((emo) => {
                      const count = reactionMap[emo] || 0;
                      return (
                        <button
                          key={emo}
                          onClick={() => onReaction(item.id, emo)}
                          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
                            count > 0
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-white"
                          }`}
                        >
                          <span>{emo}</span>
                          {count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Click emoji to react
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Broadcast New Announcement</h3>
                  <p className="text-xs text-slate-400">
                    Broadcast an official update or record an audio voice note
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Announcement Title <span className="text-sky-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 🚀 Architecture Deep-Dive Live Room Open"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="general">General Broadcast</option>
                    <option value="update">Platform Update</option>
                    <option value="alert">Important Alert</option>
                    <option value="voice_note">Voice Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Alert</option>
                  </select>
                </div>
              </div>

              {/* Audio Voice Note Recorder Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-sky-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Audio Voice Note (Optional)
                      </div>
                      <div className="text-xs text-slate-400">
                        Record a live microphone clip to broadcast
                      </div>
                    </div>
                  </div>

                  {!isRecording && !recordedAudio && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition"
                    >
                      <Mic className="h-3.5 w-3.5" /> Start Recording
                    </button>
                  )}

                  {isRecording && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 rounded-xl bg-red-500 text-white px-3 py-1.5 text-xs font-semibold animate-pulse"
                    >
                      <Square className="h-3.5 w-3.5" /> Stop ({formatDuration(recordDuration)})
                    </button>
                  )}
                </div>

                {recordedAudio && (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Check className="h-4 w-4" /> Voice note recorded ({formatDuration(recordedAudio.duration)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setRecordedAudio(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Announcement Message <span className="text-sky-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What would you like to announce to your connected users?"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Pin toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-amber-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Pin to Top</div>
                    <div className="text-xs text-slate-400">
                      Keep this announcement pinned on the dashboard
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Broadcasting..." : "Broadcast Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

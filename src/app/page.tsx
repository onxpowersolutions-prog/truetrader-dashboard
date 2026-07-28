"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header, ActiveTab } from "@/components/Header";
import { DashboardHome } from "@/components/DashboardHome";
import { VideoConference } from "@/components/VideoConference";
import { WhatsAppChat } from "@/components/WhatsAppChat";
import { AnnouncementsTab } from "@/components/AnnouncementsTab";
import { ArchitectureDocs } from "@/components/ArchitectureDocs";
import { NetworkModal } from "@/components/NetworkModal";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { InviteModal } from "@/components/InviteModal";
import { Room, Participant, Message, Announcement } from "@/db/schema";
import {
  X,
  MessageSquare,
  Sparkles,
  Wifi,
  Radio,
  Video,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function HomePage() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isHostMode, setIsHostMode] = useState(true);

  // Active room selection
  const [currentRoomId, setCurrentRoomId] = useState("truetrader-main");
  const [rooms, setRooms] = useState<(Room & { activeCount: number })[]>([]);

  // Room data
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Unread badge counters
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  // User identity
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("True Trader (Host)");

  // Modals state
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);

  // Connectivity metrics
  const [latency, setLatency] = useState(18);
  const [isOnline, setIsOnline] = useState(true);
  const [webrtcState, setWebrtcState] = useState("Connected");

  // Generate or restore persistent participant ID
  useEffect(() => {
    let savedId = "";
    if (typeof window !== "undefined") {
      savedId = localStorage.getItem("connecthub_user_id") || "";
      if (!savedId) {
        savedId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem("connecthub_user_id", savedId);
      }

      // Check URL search parameter for room invitation link
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get("room");
      if (urlRoom) {
        setCurrentRoomId(urlRoom);
      }
    }
    setCurrentUserId(savedId);
  }, []);

  // Sync display name with role mode
  useEffect(() => {
    if (isHostMode) {
      setCurrentUserName("True Trader (Host)");
    } else {
      setCurrentUserName("Guest Trader");
    }
  }, [isHostMode]);

  // Reset unread counts when switching to corresponding tabs
  useEffect(() => {
    if (activeTab === "chat") {
      setUnreadChatCount(0);
    }
    if (activeTab === "announcements") {
      setUnreadAnnouncements(0);
    }
  }, [activeTab]);

  // Fetch Rooms
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (data.success && data.rooms) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  }, []);

  // Fetch Participants in current room
  const fetchParticipants = useCallback(async () => {
    if (!currentRoomId) return;
    try {
      const res = await fetch(`/api/participants?roomId=${currentRoomId}`);
      const data = await res.json();
      if (data.success && data.participants) {
        setParticipants(data.participants);
      }
    } catch (err) {
      console.error("Failed to fetch participants:", err);
    }
  }, [currentRoomId]);

  // Fetch Chat Messages
  const fetchMessages = useCallback(async () => {
    if (!currentRoomId) return;
    try {
      const res = await fetch(`/api/messages?roomId=${currentRoomId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [currentRoomId]);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (data.success && data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    }
  }, []);

  // Register or Heartbeat present user in room
  const registerPresence = useCallback(async () => {
    if (!currentUserId || !currentRoomId) return;
    try {
      await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUserId,
          roomId: currentRoomId,
          name: currentUserName,
          role: isHostMode ? "host" : "guest",
        }),
      });
      await fetchParticipants();
    } catch (err) {
      console.error("Failed to register presence:", err);
    }
  }, [currentUserId, currentRoomId, currentUserName, isHostMode, fetchParticipants]);

  // Initial load on mount and when room changes
  useEffect(() => {
    fetchRooms();
    fetchParticipants();
    fetchMessages();
    fetchAnnouncements();
  }, [fetchRooms, fetchParticipants, fetchMessages, fetchAnnouncements]);

  // Register presence whenever ID or room changes
  useEffect(() => {
    if (currentUserId && currentRoomId) {
      registerPresence();
    }
  }, [currentUserId, currentRoomId, registerPresence]);

  // Periodic internet latency ping test
  const runPingTest = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await fetch("/api/ping");
      if (res.ok) {
        const roundTrip = Math.round(performance.now() - start);
        setLatency(Math.max(8, roundTrip));
        setIsOnline(true);
        setWebrtcState("Connected (ICE OK)");
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      setIsOnline(false);
      setWebrtcState("Disconnected");
    }
  }, []);

  useEffect(() => {
    runPingTest();
    const interval = setInterval(runPingTest, 20000);
    return () => clearInterval(interval);
  }, [runPingTest]);

  // Real-time Server-Sent Events (SSE) Listener
  useEffect(() => {
    if (!currentRoomId || !currentUserId) return;

    const sseUrl = `/api/webrtc/stream?roomId=${currentRoomId}&peerId=${currentUserId}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "new-message":
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.payload.message.id)) return prev;
              return [...prev, data.payload.message];
            });
            if (activeTab !== "chat" && !isChatSidebarOpen) {
              setUnreadChatCount((cnt) => cnt + 1);
            }
            break;

          case "message-deleted":
            setMessages((prev) =>
              prev.filter((m) => m.id !== data.payload.id)
            );
            break;

          case "new-announcement":
          case "announcement-updated":
          case "announcement-deleted":
            fetchAnnouncements();
            if (
              data.type === "new-announcement" &&
              activeTab !== "announcements"
            ) {
              setUnreadAnnouncements((cnt) => cnt + 1);
            }
            break;

          case "peer-joined":
          case "peer-left":
          case "peer-state-changed":
            fetchParticipants();
            break;

          case "room-updated":
            fetchRooms();
            break;

          default:
            break;
        }
      } catch (err) {
        console.error("Error handling SSE event:", err);
      }
    };

    eventSource.onerror = () => {
      // Reconnection handled by browser EventSource
    };

    return () => {
      eventSource.close();
    };
  }, [
    currentRoomId,
    currentUserId,
    activeTab,
    isChatSidebarOpen,
    fetchAnnouncements,
    fetchParticipants,
    fetchRooms,
  ]);

  // Handlers for room creation and state updates
  const handleCreateRoom = async (data: {
    title: string;
    hostName: string;
    description: string;
    pinCode?: string;
    isLocked?: boolean;
    customRoomId?: string;
  }) => {
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to create room");
    }
    await fetchRooms();
    setCurrentRoomId(result.room.roomId);
    setActiveTab("conference");
  };

  const handleUpdateMyState = async (data: {
    isMuted?: boolean;
    isVideoOff?: boolean;
    isScreenSharing?: boolean;
  }) => {
    if (!currentUserId || !currentRoomId) return;
    await fetch("/api/participants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: currentUserId,
        roomId: currentRoomId,
        ...data,
      }),
    });
    await fetchParticipants();
  };

  const handleSendMessage = async (data: {
    content: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    replyToId?: number;
    replyToText?: string;
    replyToSender?: string;
  }) => {
    if (!currentUserId || !currentRoomId) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: currentRoomId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: isHostMode ? "host" : "guest",
        ...data,
      }),
    });
  };

  const handleDeleteMessage = async (messageId: number) => {
    await fetch(
      `/api/messages?id=${messageId}&roomId=${currentRoomId}`,
      { method: "DELETE" }
    );
  };

  const handlePostAnnouncement = async (data: {
    title: string;
    content: string;
    category?: string;
    voiceUrl?: string;
    voiceDuration?: number;
    priority?: string;
    isPinned?: boolean;
    authorName?: string;
  }) => {
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchAnnouncements();
  };

  const handleTogglePinAnnouncement = async (
    id: number,
    currentPinned: boolean
  ) => {
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPinned: !currentPinned }),
    });
    await fetchAnnouncements();
  };

  const handleReactionAnnouncement = async (id: number, emoji: string) => {
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reactionEmoji: emoji, reactionDelta: 1 }),
    });
    await fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: number) => {
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    await fetchAnnouncements();
  };

  const currentRoom =
    rooms.find((r) => r.roomId === currentRoomId) || rooms[0] || {
      roomId: currentRoomId,
      title: "True Trader — Live Main Lounge",
      hostName: "True Trader (Admin Host)",
      description: "Live Interactive Trading & Communication Room",
    };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRoomTitle={currentRoom.title}
        activeRoomId={currentRoomId}
        isHostMode={isHostMode}
        setIsHostMode={setIsHostMode}
        latency={latency}
        isOnline={isOnline}
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        onOpenCreateRoomModal={() => setIsCreateRoomModalOpen(true)}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        unreadChatCount={unreadChatCount}
        unreadAnnouncements={unreadAnnouncements}
      />

      {/* Main Container Viewport */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-6 sm:px-6">
        {activeTab === "overview" && (
          <DashboardHome
            rooms={rooms}
            currentRoomId={currentRoomId}
            onSelectRoom={(id) => setCurrentRoomId(id)}
            isHostMode={isHostMode}
            onOpenCreateRoom={() => setIsCreateRoomModalOpen(true)}
            onOpenInvite={() => setIsInviteModalOpen(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            recentAnnouncements={announcements.filter((a) => a.isPinned)}
          />
        )}

        {activeTab === "conference" && (
          <div className="relative flex w-full flex-col lg:flex-row gap-4 pb-16">
            <div className="flex-1">
              <VideoConference
                roomId={currentRoomId}
                roomTitle={currentRoom.title}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                isHost={isHostMode}
                participants={participants}
                onUpdateMyState={handleUpdateMyState}
                onOpenChatSidebar={() => setIsChatSidebarOpen(!isChatSidebarOpen)}
                onOpenInviteModal={() => setIsInviteModalOpen(true)}
                isOnline={isOnline}
                latency={latency}
              />
            </div>

            {/* Optional Floating WhatsApp-like Chat Sidebar during a Video Call */}
            {isChatSidebarOpen && (
              <div className="w-full lg:w-96 shrink-0 z-20">
                <WhatsAppChat
                  roomId={currentRoomId}
                  roomTitle={currentRoom.title}
                  messages={messages}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  currentUserRole={isHostMode ? "host" : "guest"}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={handleDeleteMessage}
                  isSidebarMode={true}
                  onCloseSidebar={() => setIsChatSidebarOpen(false)}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="pb-16">
            <WhatsAppChat
              roomId={currentRoomId}
              roomTitle={currentRoom.title}
              messages={messages}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserRole={isHostMode ? "host" : "guest"}
              onSendMessage={handleSendMessage}
              onDeleteMessage={handleDeleteMessage}
            />
          </div>
        )}

        {activeTab === "announcements" && (
          <AnnouncementsTab
            announcements={announcements}
            isHostMode={isHostMode}
            onPostAnnouncement={handlePostAnnouncement}
            onTogglePin={handleTogglePinAnnouncement}
            onReaction={handleReactionAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            defaultHostName={currentUserName}
          />
        )}

        {activeTab === "architecture" && <ArchitectureDocs />}
      </main>

      {/* Modals */}
      <NetworkModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        latency={latency}
        isOnline={isOnline}
        webrtcState={webrtcState}
        onRunPingTest={runPingTest}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        defaultHostName={currentUserName}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomTitle={currentRoom.title}
        roomId={currentRoomId}
        pinCode={currentRoom.pinCode || undefined}
      />
    </div>
  );
}

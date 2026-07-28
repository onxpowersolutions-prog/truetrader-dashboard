"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  Reply,
  Trash2,
  FileText,
  Image as ImageIcon,
  Download,
  CheckCheck,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { Message } from "@/db/schema";
import { playNotificationChime } from "@/lib/sound";

interface WhatsAppChatProps {
  roomId: string;
  roomTitle: string;
  messages: Message[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onSendMessage: (data: {
    content: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    replyToId?: number;
    replyToText?: string;
    replyToSender?: string;
  }) => Promise<void>;
  onDeleteMessage: (messageId: number) => Promise<void>;
  isSidebarMode?: boolean;
  onCloseSidebar?: () => void;
}

const COMMON_EMOJIS = [
  "👍", "❤️", "🔥", "🚀", "👏", "😊", "🎉", "💡",
  "💯", "⭐", "💻", "🎯", "🙌", "✅", "⚡", "😂"
];

export function WhatsAppChat({
  roomId,
  roomTitle,
  messages,
  currentUserId,
  currentUserName,
  currentUserRole,
  onSendMessage,
  onDeleteMessage,
  isSidebarMode = false,
  onCloseSidebar,
}: WhatsAppChatProps) {
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);

  // File attachment preview state
  const [attachedFile, setAttachedFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: string;
    type: "image" | "file";
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedFile) || sending) return;

    setSending(true);
    try {
      await onSendMessage({
        content:
          inputText.trim() ||
          (attachedFile ? `Shared file: ${attachedFile.fileName}` : ""),
        type: attachedFile ? attachedFile.type : "text",
        fileUrl: attachedFile?.fileUrl,
        fileName: attachedFile?.fileName,
        fileSize: attachedFile?.fileSize,
        replyToId: replyTarget?.id,
        replyToText: replyTarget?.content,
        replyToSender: replyTarget?.senderName,
      });

      setInputText("");
      setAttachedFile(null);
      setReplyTarget(null);
      setShowEmojiPicker(false);
      playNotificationChime();
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB for base64 demo)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select a file smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith("image/");
      const sizeKB = (file.size / 1024).toFixed(1);
      setAttachedFile({
        fileUrl: reader.result as string,
        fileName: file.name,
        fileSize:
          Number(sizeKB) > 1024
            ? `${(Number(sizeKB) / 1024).toFixed(1)} MB`
            : `${sizeKB} KB`,
        type: isImg ? "image" : "file",
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (dateStr?: Date | string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Security & Privacy rule: Guests only see messages from Admin/Host or themselves.
  const visibleMessages =
    currentUserRole === "host"
      ? messages
      : messages.filter(
          (m) => m.senderRole === "host" || m.senderId === currentUserId
        );

  return (
    <div
      className={`flex flex-col overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl ${
        isSidebarMode
          ? "h-full w-full sm:w-96 rounded-2xl"
          : "h-[calc(100vh-140px)] min-h-[520px] w-full rounded-3xl"
      }`}
    >
      {/* WhatsApp-like Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
              <span>{roomTitle} Chat</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Live
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  currentUserRole === "host"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {currentUserRole === "host" ? "Admin Mode" : "Private to Host"}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {visibleMessages.length} message{visibleMessages.length === 1 ? "" : "s"} •{" "}
              {currentUserRole === "host"
                ? "Seeing all client messages"
                : "🔒 Private Q&A with Host"}
            </p>
          </div>
        </div>

        {isSidebarMode && onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-950 to-slate-900/30">
        {/* Security mode notification in chat */}
        <div
          className={`rounded-xl border px-3.5 py-2 text-xs mb-4 ${
            currentUserRole === "host"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {currentUserRole === "host"
            ? "🛡️ Admin Security Mode: You can read all client messages in this room."
            : "🔒 Confidentiality Mode: Your messages are private between you and Admin/Host. Messages from other clients are hidden."}
        </div>

        {visibleMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-white text-base">No messages yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Say hello! Send a message, emoji, or file attachment to start the conversation.
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isHostSender = msg.senderRole === "host";

            return (
              <div
                key={msg.id}
                className={`group flex flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                {/* Sender label */}
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-1 pl-1">
                    <span className="text-xs font-semibold text-slate-300">
                      {msg.senderName}
                    </span>
                    {isHostSender && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        <UserCheck className="h-2.5 w-2.5" /> HOST
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] rounded-2xl p-3.5 shadow-md ${
                    isMe
                      ? "rounded-tr-none bg-gradient-to-r from-indigo-600 to-sky-600 text-white"
                      : "rounded-tl-none border border-slate-800 bg-slate-900/90 text-slate-100"
                  }`}
                >
                  {/* Quote Reply preview if replying to a message */}
                  {msg.replyToText && (
                    <div
                      className={`mb-2 rounded-xl p-2 text-xs border-l-2 ${
                        isMe
                          ? "border-white/80 bg-black/20 text-slate-100"
                          : "border-sky-500 bg-slate-950/60 text-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-[11px] opacity-90 mb-0.5">
                        Replying to: {msg.replyToSender}
                      </div>
                      <div className="line-clamp-2 italic">{msg.replyToText}</div>
                    </div>
                  )}

                  {/* Attachment preview if image or file */}
                  {msg.fileUrl && (
                    <div className="mb-2">
                      {msg.type === "image" ? (
                        <div className="overflow-hidden rounded-xl border border-white/20">
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || "Image attachment"}
                            className="max-h-52 w-full object-cover"
                          />
                        </div>
                      ) : (
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName || "attachment"}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2.5 rounded-xl p-3 text-xs transition ${
                            isMe
                              ? "bg-black/20 hover:bg-black/30"
                              : "border border-slate-700 bg-slate-950 hover:bg-slate-800"
                          }`}
                        >
                          <FileText className="h-6 w-6 shrink-0 text-sky-400" />
                          <div className="flex-1 truncate">
                            <div className="font-semibold truncate">
                              {msg.fileName || "Download Attachment"}
                            </div>
                            <div className="text-[10px] opacity-75">
                              {msg.fileSize || "File"}
                            </div>
                          </div>
                          <Download className="h-4 w-4 shrink-0" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Text body */}
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Footer metadata: timestamp, read check, reply action */}
                  <div
                    className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${
                      isMe ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMe && <CheckCheck className="h-3 w-3 text-sky-300" />}

                    {/* Quick action buttons on hover */}
                    <div className="hidden group-hover:flex items-center gap-1 ml-1">
                      <button
                        onClick={() => setReplyTarget(msg)}
                        className="rounded p-0.5 hover:bg-white/10"
                        title="Reply to message"
                      >
                        <Reply className="h-3 w-3" />
                      </button>
                      {(isMe || currentUserRole === "host") && (
                        <button
                          onClick={() => onDeleteMessage(msg.id)}
                          className="rounded p-0.5 hover:bg-red-500/20 text-red-300"
                          title="Delete message"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quote reply banner if active */}
      {replyTarget && (
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <Reply className="h-3.5 w-3.5 text-sky-400" />
            <span className="truncate">
              Replying to <strong>{replyTarget.senderName}</strong>:{" "}
              {replyTarget.content}
            </span>
          </div>
          <button
            onClick={() => setReplyTarget(null)}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attachment preview card if selected */}
      {attachedFile && (
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs text-slate-200">
          <div className="flex items-center gap-2.5 truncate">
            {attachedFile.type === "image" ? (
              <ImageIcon className="h-5 w-5 text-sky-400" />
            ) : (
              <FileText className="h-5 w-5 text-indigo-400" />
            )}
            <div className="truncate">
              <div className="font-semibold truncate">{attachedFile.fileName}</div>
              <div className="text-[10px] text-slate-400">
                {attachedFile.fileSize}
              </div>
            </div>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Emoji selector drawer */}
      {showEmojiPicker && (
        <div className="border-t border-slate-800 bg-slate-900 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Quick Emoji Reactions
          </div>
          <div className="grid grid-cols-8 gap-2">
            {COMMON_EMOJIS.map((emo) => (
              <button
                key={emo}
                type="button"
                onClick={() => insertEmoji(emo)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 text-lg hover:bg-slate-700 hover:scale-110 transition"
              >
                {emo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat input footer */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-slate-800 bg-slate-950 p-3"
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />

        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          title="Attach File or Image"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Emoji toggle button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          title="Insert Emoji"
        >
          <Smile className="h-4 w-4" />
        </button>

        {/* Input field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={(!inputText.trim() && !attachedFile) || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

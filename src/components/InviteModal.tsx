"use client";

import React, { useState } from "react";
import { Copy, Check, QrCode, Share2, Globe, Lock, ExternalLink, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  roomId: string;
  pinCode?: string;
}

export function InviteModal({
  isOpen,
  onClose,
  roomTitle,
  roomId,
  pinCode,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?room=${encodeURIComponent(roomId)}`
      : `https://connecthub.app/?room=${roomId}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Share Invitation & Link</h3>
              <p className="text-xs text-slate-400">Invite guests to join this meeting room</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Room info card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between">
            <div>
              <div className="font-medium text-white text-sm">{roomTitle}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {roomId}</div>
            </div>
            {pinCode ? (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                <Lock className="h-3 w-3" /> PIN: {pinCode}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <Globe className="h-3 w-3" /> Open Room
              </span>
            )}
          </div>

          {/* Share link box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Direct Join Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 px-4 py-2.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 transition"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center">
            <div className="rounded-xl bg-white p-3 shadow-lg">
              <QRCodeSVG
                value={shareUrl}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 text-slate-400" />
              Scan QR code on mobile device to join instantly
            </div>
          </div>

          {/* Done button */}
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { TicketMessage } from "@/types";
import { Check, CheckCheck, FileText, CornerUpLeft } from "lucide-react";
import { Button } from "@heroui/react";

function getBody(m: TicketMessage) {
  return m.text ?? (m as { content?: string }).content ?? "";
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface ReplyReferenceProps {
  replyToId: string | null;
  replyPreview?: string;
}

function ReplyReference({ replyToId, replyPreview }: ReplyReferenceProps) {
  if (!replyToId) return null;

  return (
    <div className="mb-1 rounded border-l-4 border-wa-teal bg-black/5 px-2 py-1 dark:bg-white/5">
      <p className="text-[11px] sm:text-[12px] text-wa-teal font-medium">
        {replyPreview ? replyPreview.slice(0, 80) : "Mensaje citado"}
      </p>
    </div>
  );
}

interface MessageContentProps {
  message: TicketMessage;
  mediaUrl: string | undefined;
}

function MessageContent({ message: m, mediaUrl }: MessageContentProps) {
  if (m.messageType === "TEXT") {
    return (
      <p className="whitespace-pre-wrap text-[13.5px] sm:text-[14.2px] leading-[18px] sm:leading-[19px] text-zinc-900 dark:text-zinc-100">
        {getBody(m)}
      </p>
    );
  }

  if (m.messageType === "IMAGE") {
    if (mediaUrl) {
      return (
        <img
          src={mediaUrl}
          alt=""
          className="max-h-[200px] sm:max-h-[280px] lg:max-h-[330px] rounded-md object-contain"
          loading="lazy"
        />
      );
    }
    if (m.r2ObjectKey) {
      return (
        <div className="flex h-32 w-32 sm:h-48 sm:w-48 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700">
          <span className="animate-pulse text-xs text-wa-time dark:text-wa-time-dark">
            Cargando…
          </span>
        </div>
      );
    }
  }

  if (m.messageType === "VIDEO" && mediaUrl) {
    return (
      <video
        src={mediaUrl}
        className="max-h-[200px] sm:max-h-[280px] lg:max-h-[330px] rounded-md w-full"
        controls
      />
    );
  }

  if (m.messageType === "AUDIO" && mediaUrl) {
    return <audio src={mediaUrl} controls className="w-44 sm:w-56" />;
  }

  if (m.messageType === "DOCUMENT" && mediaUrl) {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-md bg-black/5 px-2 sm:px-3 py-2 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <FileText size={18} className="text-wa-teal sm:size-5" />
        <span className="min-w-0 flex-1 truncate text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
          {m.fileName || "Documento"}
        </span>
      </a>
    );
  }

  if (!m.r2ObjectKey) {
    return (
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{getBody(m) || m.messageType}</p>
    );
  }

  return null;
}

interface StatusIndicatorsProps {
  createdAt: string;
  isAgent: boolean;
  readAt: string | null;
}

function StatusIndicators({ createdAt, isAgent, readAt }: StatusIndicatorsProps) {
  return (
    <div className="mt-0.5 flex items-center justify-end gap-1">
      <span className="text-[10px] sm:text-[11px] leading-none text-wa-time dark:text-wa-time-dark">
        {formatTime(createdAt)}
      </span>
      {isAgent && readAt && <CheckCheck size={12} className="text-sky-500 sm:size-[14px]" />}
      {isAgent && !readAt && (
        <Check size={12} className="text-wa-time dark:text-wa-time-dark sm:size-[14px]" />
      )}
    </div>
  );
}

interface ReplyButtonProps {
  onReply: () => void;
}

function ReplyButton({ onReply }: ReplyButtonProps) {
  return (
    <div className="absolute -right-2 top-0 hidden lg:group-hover:block z-10 animate-in fade-in zoom-in duration-100">
      <Button
        isIconOnly
        size="sm"
        variant="flat"
        radius="full"
        onPress={onReply}
        className="bg-white/80 dark:bg-wa-incoming-dark/80 backdrop-blur-sm shadow-md h-7 w-7 min-w-unit-7"
        aria-label="Responder"
      >
        <CornerUpLeft size={12} className="text-wa-time dark:text-wa-time-dark" />
      </Button>
    </div>
  );
}

interface MessageBubbleProps {
  message: TicketMessage;
  isAgent: boolean;
  mediaUrl: string | undefined;
  onReply: (m: TicketMessage) => void;
  replyPreview?: string;
}

export function MessageBubble({
  message: m,
  isAgent,
  mediaUrl,
  onReply,
  replyPreview,
}: MessageBubbleProps) {
  const bubbleBase = isAgent
    ? "bg-wa-outgoing-light dark:bg-wa-outgoing-dark"
    : "bg-wa-incoming-light dark:bg-wa-incoming-dark";

  const align = isAgent ? "justify-end" : "justify-start";

  return (
    <div className={`group flex ${align} mb-1 px-2 sm:px-3 md:px-4 lg:px-[5%] xl:px-[7%]`}>
      <div
        className={`relative max-w-[92%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] rounded-lg px-2 sm:px-2.5 pb-1.5 pt-1.5 shadow-sm ${bubbleBase}`}
      >
        <ReplyReference replyToId={m.replyToId} replyPreview={replyPreview} />
        <MessageContent message={m} mediaUrl={mediaUrl} />
        <StatusIndicators createdAt={m.createdAt} isAgent={isAgent} readAt={m.readAt} />
        <ReplyButton onReply={() => onReply(m)} />
      </div>
    </div>
  );
}

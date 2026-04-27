"use client";

import React, { FormEvent, RefObject } from "react";
import { TicketMessage } from "@/types";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import { Input, Button } from "@heroui/react";

function getBody(m: TicketMessage) {
  return m.text ?? (m as { content?: string }).content ?? "";
}

interface ComposerProps {
  text: string;
  onTextChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  replyTo: TicketMessage | null;
  onCancelReply: () => void;
  fileRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}

export function Composer({
  text,
  onTextChange,
  onSubmit,
  replyTo,
  onCancelReply,
  fileRef,
  disabled,
}: ComposerProps) {
  return (
    <div className="flex-shrink-0 bg-wa-input-light dark:bg-wa-input-dark border-t border-wa-border-light dark:border-wa-border-dark">
      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-2 border-l-4 border-wa-teal bg-wa-panel-light px-4 py-2 dark:bg-wa-panel-dark animate-in slide-in-from-bottom-2 duration-200">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-wa-teal">Respondiendo</p>
            <p className="truncate text-xs text-wa-time dark:text-wa-time-dark">
              {getBody(replyTo).slice(0, 100) || "📎 Media"}
            </p>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="full"
            onPress={onCancelReply}
            aria-label="Cancelar respuesta"
          >
            <X size={18} />
          </Button>
        </div>
      )}

      {/* Input row */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 px-3 py-2">
        {/* Attach */}
        <Button
          isIconOnly
          variant="light"
          radius="full"
          onPress={() => fileRef.current?.click()}
          className="text-wa-time dark:text-wa-time-dark flex-shrink-0"
          aria-label="Adjuntar archivo"
        >
          <Paperclip size={24} />
        </Button>
        <input
          type="file"
          ref={fileRef}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => {}}
        />

        {/* Text input */}
        <div className="min-w-0 flex-1">
          <Input
            placeholder="Escribe un mensaje"
            value={text}
            onValueChange={onTextChange}
            disabled={disabled}
            variant="flat"
            radius="lg"
            size="md"
            autoComplete="off"
            classNames={{
              input: "text-[15px]",
              inputWrapper: "bg-white dark:bg-wa-header-dark h-11 shadow-none",
            }}
            aria-label="Mensaje"
          />
        </div>

        {/* Send */}
        <Button
          isIconOnly
          type="submit"
          disabled={disabled || (!text.trim() && !fileRef.current?.files?.length)}
          variant="light"
          radius="full"
          className="text-wa-time dark:text-wa-time-dark flex-shrink-0"
          aria-label="Enviar mensaje"
        >
          <SendHorizontal size={24} />
        </Button>
      </form>
    </div>
  );
}

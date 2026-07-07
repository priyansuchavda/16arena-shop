"use client";

import React from "react";
import { Check, Copy } from "lucide-react";
import type { OrderCredentialField } from "../utils/order-credentials";

type OrderCredentialFieldsProps = {
  fields: OrderCredentialField[];
  copiedId: string | null;
  onCopy: (value: string, id: string) => void;
};

export function OrderCredentialFields({
  fields,
  copiedId,
  onCopy,
}: OrderCredentialFieldsProps) {
  if (fields.length === 0) return null;

  return (
    <div className="mt-1 flex flex-col gap-2.5">
      {fields.map((field) => {
        const isPin = field.highlight === "pin";

        return (
          <div
            key={field.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-black/35 px-4 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                {field.label}
              </span>
              <p
                className={`mt-1.5 break-all text-[15px] font-semibold leading-6 tracking-normal ${
                  isPin ? "text-[#FFA000]" : "text-white"
                }`}
              >
                {field.value}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onCopy(field.value, field.id)}
              aria-label={`Copy ${field.label}`}
              className="mt-0.5 shrink-0 rounded-lg border border-white/8 bg-white/5 p-2.5 transition hover:bg-white/10 active:scale-95"
            >
              {copiedId === field.id ? (
                <Check className="h-4 w-4 text-[var(--win)]" />
              ) : (
                <Copy className="h-4 w-4 text-white/50" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

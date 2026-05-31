"use client";

import { Search } from "lucide-react";

export function SearchInput({ value, onChange, placeholder = "Buscar…" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex w-full max-w-[260px] items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 py-1.5">
      <Search size={15} className="text-faint" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint" />
    </div>
  );
}

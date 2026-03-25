"use client";

import { SCORE_MIN, SCORE_MAX } from "@keymaker/shared";

interface AxisInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function AxisInput({ label, value, onChange, disabled }: AxisInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-24 text-sm font-medium text-meta">{label}</label>
      <div className="flex gap-1">
        {[SCORE_MIN, -1, 0, 1, SCORE_MAX].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-md border text-sm font-medium ${
              value === n
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-subtle bg-elevated text-prose hover:bg-rowHover"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {n > 0 ? `+${n}` : n}
          </button>
        ))}
      </div>
    </div>
  );
}

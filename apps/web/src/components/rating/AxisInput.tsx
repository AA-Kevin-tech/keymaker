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
      <label className="w-24 text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[SCORE_MIN, -1, 0, 1, SCORE_MAX].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded text-sm font-medium border ${
              value === n
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-300 hover:bg-gray-50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {n > 0 ? `+${n}` : n}
          </button>
        ))}
      </div>
    </div>
  );
}

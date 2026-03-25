"use client";

import { useState } from "react";
import { AxisInput } from "./AxisInput";
import { Button } from "@/components/ui/Button";
import type { RatingDimensions } from "@/lib/types";

const AXES: { key: keyof RatingDimensions; label: string }[] = [
  { key: "clarity", label: "Clarity" },
  { key: "evidence", label: "Evidence" },
  { key: "kindness", label: "Kindness" },
  { key: "novelty", label: "Novelty" },
];

interface RatingWidgetProps {
  targetType: "post" | "comment";
  targetId: string;
  raterId: string;
  token: string | null;
  onSubmit: (dimensions: RatingDimensions) => Promise<void>;
  initial?: Partial<RatingDimensions>;
}

export function RatingWidget({
  targetType,
  targetId,
  raterId,
  token,
  onSubmit,
  initial = {},
}: RatingWidgetProps) {
  const [clarity, setClarity] = useState(initial.clarity ?? 0);
  const [evidence, setEvidence] = useState(initial.evidence ?? 0);
  const [kindness, setKindness] = useState(initial.kindness ?? 0);
  const [novelty, setNovelty] = useState(initial.novelty ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="text-sm text-meta">
        <a href="/login" className="text-link hover:underline">
          Log in
        </a>{" "}
        to rate.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ clarity, evidence, kindness, novelty });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-subtle bg-canvas p-3"
    >
      <p className="text-sm font-medium text-ink">
        Rate this {targetType}
      </p>
      {AXES.map(({ key, label }) => (
        <AxisInput
          key={key}
          label={label}
          value={
            key === "clarity"
              ? clarity
              : key === "evidence"
                ? evidence
                : key === "kindness"
                  ? kindness
                  : novelty
          }
          onChange={(v) => {
            if (key === "clarity") setClarity(v);
            else if (key === "evidence") setEvidence(v);
            else if (key === "kindness") setKindness(v);
            else setNovelty(v);
          }}
          disabled={loading}
        />
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit rating"}
      </Button>
    </form>
  );
}

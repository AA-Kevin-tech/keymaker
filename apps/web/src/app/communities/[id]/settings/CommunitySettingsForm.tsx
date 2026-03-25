"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Community } from "@/lib/types";
import Link from "next/link";

interface CommunitySettingsFormProps {
  community: Community;
  slug: string;
}

export function CommunitySettingsForm({ community, slug }: CommunitySettingsFormProps) {
  const router = useRouter();
  const token = getToken();
  const [weightClarity, setWeightClarity] = useState(String(community.weightClarity ?? 1));
  const [weightEvidence, setWeightEvidence] = useState(String(community.weightEvidence ?? 1));
  const [weightKindness, setWeightKindness] = useState(String(community.weightKindness ?? 1));
  const [weightNovelty, setWeightNovelty] = useState(String(community.weightNovelty ?? 1));
  const [decayHalfLifeSeconds, setDecayHalfLifeSeconds] = useState(
    String(community.decayHalfLifeSeconds ?? 86400)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("You must be logged in to change settings.");
      return;
    }
    const wc = parseFloat(weightClarity);
    const we = parseFloat(weightEvidence);
    const wk = parseFloat(weightKindness);
    const wn = parseFloat(weightNovelty);
    const decay = parseInt(decayHalfLifeSeconds, 10);
    if ([wc, we, wk, wn].some(Number.isNaN)) {
      setError("Weights must be numbers.");
      return;
    }
    if (Number.isNaN(decay) || decay < 1) {
      setError("Decay half-life must be a positive integer (seconds).");
      return;
    }
    setLoading(true);
    try {
      await api.patch(
        `/communities/${slug}`,
        {
          weightClarity: wc,
          weightEvidence: we,
          weightKindness: wk,
          weightNovelty: wn,
          decayHalfLifeSeconds: decay,
        },
        token
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-meta">
        <Link href="/login" className="text-link hover:underline">
          Log in
        </Link>{" "}
        to edit community settings.
      </p>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="weightClarity" className="mb-1 block text-sm font-medium text-ink">
              Weight: Clarity
            </label>
            <Input
              id="weightClarity"
              type="number"
              step="0.1"
              min="0"
              value={weightClarity}
              onChange={(e) => setWeightClarity(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="weightEvidence" className="mb-1 block text-sm font-medium text-ink">
              Weight: Evidence
            </label>
            <Input
              id="weightEvidence"
              type="number"
              step="0.1"
              min="0"
              value={weightEvidence}
              onChange={(e) => setWeightEvidence(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="weightKindness" className="mb-1 block text-sm font-medium text-ink">
              Weight: Kindness
            </label>
            <Input
              id="weightKindness"
              type="number"
              step="0.1"
              min="0"
              value={weightKindness}
              onChange={(e) => setWeightKindness(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="weightNovelty" className="mb-1 block text-sm font-medium text-ink">
              Weight: Novelty
            </label>
            <Input
              id="weightNovelty"
              type="number"
              step="0.1"
              min="0"
              value={weightNovelty}
              onChange={(e) => setWeightNovelty(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="decayHalfLifeSeconds" className="mb-1 block text-sm font-medium text-ink">
            Decay half-life (seconds)
          </label>
          <Input
            id="decayHalfLifeSeconds"
            type="number"
            min="1"
            step="1"
            value={decayHalfLifeSeconds}
            onChange={(e) => setDecayHalfLifeSeconds(e.target.value)}
          />
          <p className="mt-1 text-xs text-meta">
            e.g. 86400 = 24 hours. Newer posts rank higher over time.
          </p>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Card>
  );
}

import type { Post } from "@/lib/types";

const AXES = [
  { key: "cachedClarity" as const, label: "Clarity" },
  { key: "cachedEvidence" as const, label: "Evidence" },
  { key: "cachedKindness" as const, label: "Kindness" },
  { key: "cachedNovelty" as const, label: "Novelty" },
] as const;

interface ScoreBadgesProps {
  post: Pick<
    Post,
    "cachedClarity" | "cachedEvidence" | "cachedKindness" | "cachedNovelty" | "ratingCount"
  >;
}

export function ScoreBadges({ post }: ScoreBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {AXES.map(({ key, label }) => (
        <span
          key={key}
          className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-canvas text-gray-700"
        >
          {label}: {post[key].toFixed(1)}
        </span>
      ))}
      {post.ratingCount > 0 && (
        <span className="text-xs text-meta">{post.ratingCount} ratings</span>
      )}
    </div>
  );
}

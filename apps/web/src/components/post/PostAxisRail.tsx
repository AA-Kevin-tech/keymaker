import type { Post } from "@/lib/types";

const AXES = [
  { key: "cachedClarity" as const, short: "C" },
  { key: "cachedEvidence" as const, short: "E" },
  { key: "cachedKindness" as const, short: "K" },
  { key: "cachedNovelty" as const, short: "N" },
] as const;

interface PostAxisRailProps {
  post: Pick<
    Post,
    "cachedClarity" | "cachedEvidence" | "cachedKindness" | "cachedNovelty" | "ratingCount"
  >;
}

export function PostAxisRail({ post }: PostAxisRailProps) {
  return (
    <div
      className="flex shrink-0 flex-row flex-wrap gap-x-2 gap-y-0.5 sm:w-[4.5rem] sm:flex-col sm:items-center sm:justify-center sm:gap-1.5 sm:self-stretch sm:border-r sm:border-subtle sm:pr-3"
      aria-label="Axis scores"
    >
      {AXES.map(({ key, short }) => (
        <span
          key={key}
          className="font-mono text-[0.65rem] leading-tight tabular-nums text-meta sm:text-center"
        >
          <span className="text-meta">{short}</span>{" "}
          <span className="text-ink">
            {post.ratingCount > 0 ? post[key].toFixed(1) : "—"}
          </span>
        </span>
      ))}
    </div>
  );
}

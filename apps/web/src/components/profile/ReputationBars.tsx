import type { User } from "@/lib/types";

const AXES: { key: keyof Pick<User, "reputationClarity" | "reputationEvidence" | "reputationNovelty">; label: string }[] = [
  { key: "reputationClarity", label: "Clarity" },
  { key: "reputationEvidence", label: "Evidence" },
  { key: "reputationNovelty", label: "Novelty" },
];

interface ReputationBarsProps {
  user: User;
}

function barWidth(value: number): string {
  const min = -2;
  const max = 2;
  const pct = ((value - min) / (max - min)) * 100;
  return `${Math.max(0, Math.min(100, pct))}%`;
}

export function ReputationBars({ user }: ReputationBarsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-ink">Reputation (three axes)</h2>
      {AXES.map(({ key, label }) => (
        <div key={key}>
          <div className="mb-0.5 flex justify-between text-sm">
            <span className="text-meta">{label}</span>
            <span className="font-medium text-prose">{user[key].toFixed(2)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-subtle">
            <div
              className="h-full rounded bg-link"
              style={{ width: barWidth(user[key]) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

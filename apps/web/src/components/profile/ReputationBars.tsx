import type { User } from "@/lib/types";

const AXES: { key: keyof Pick<User, "reputationClarity" | "reputationEvidence" | "reputationKindness" | "reputationNovelty">; label: string }[] = [
  { key: "reputationClarity", label: "Clarity" },
  { key: "reputationEvidence", label: "Evidence" },
  { key: "reputationKindness", label: "Kindness" },
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
      <h2 className="text-sm font-medium text-gray-700">Reputation (four axes)</h2>
      {AXES.map(({ key, label }) => (
        <div key={key}>
          <div className="flex justify-between text-sm mb-0.5">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium">{user[key].toFixed(2)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded"
              style={{ width: barWidth(user[key]) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

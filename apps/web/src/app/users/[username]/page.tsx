import { notFound } from "next/navigation";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ReputationBars } from "@/components/profile/ReputationBars";
import type { User } from "@/lib/types";

interface Params {
  username: string;
}

async function getUser(username: string): Promise<User | null> {
  try {
    return await api.get<User>(`/users/${username}`);
  } catch {
    return null;
  }
}

export default async function UserProfilePage({ params }: { params: Params }) {
  const user = await getUser(params.username);
  if (!user) notFound();

  return (
    <main className="py-6">
      <ProfileHeader user={user} />
      <ReputationBars user={user} />
    </main>
  );
}

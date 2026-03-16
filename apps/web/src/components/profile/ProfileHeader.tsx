import type { User } from "@/lib/types";

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">{user.username}</h1>
      <p className="text-sm text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  );
}

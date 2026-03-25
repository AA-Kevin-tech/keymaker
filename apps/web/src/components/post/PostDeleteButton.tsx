"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface PostDeleteButtonProps {
  postId: string;
  authorId: string;
}

export function PostDeleteButton({ postId, authorId }: PostDeleteButtonProps) {
  const router = useRouter();
  const token = getToken();
  const { user } = useCurrentUser();
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user?.id === authorId;
  if (!isAuthor || !token) return null;

  const handleDelete = async () => {
    if (!token || deleting) return;
    const ok = window.confirm(
      "Delete this post? It will be removed from the community. You can restore it from the post page if you still have the link."
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.post(`/posts/${postId}/hide`, {}, token);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className="!h-auto !min-h-0 rounded px-2 py-0 text-xs font-normal text-meta hover:text-red-400"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleDelete();
      }}
      disabled={deleting}
    >
      {deleting ? "Deleting…" : "Delete"}
    </Button>
  );
}

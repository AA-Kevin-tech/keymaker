"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { CurrentUser } from "@/lib/auth";

export function useCurrentUser(): { user: CurrentUser | null; loading: boolean } {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    api
      .get<{ user: CurrentUser }>("/auth/me", token)
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

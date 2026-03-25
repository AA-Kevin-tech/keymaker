"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

const linkBase =
  "text-sm text-meta hover:text-ink transition-colors";
const linkActive = "text-sm font-semibold text-link";

export function Navbar() {
  const pathname = usePathname();
  const token = getToken();
  const { user } = useCurrentUser();

  return (
    <nav className="sticky top-0 z-20 h-14 border-b border-subtle bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold text-ink">
          Keymaker
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/communities"
            className={
              pathname?.startsWith("/communities") ? linkActive : linkBase
            }
          >
            Communities
          </Link>
          {token ? (
            <>
              {user && (
                <Link
                  href={`/users/${user.username}`}
                  className="text-sm font-medium text-accentUser transition-colors hover:underline"
                >
                  {user.username}
                </Link>
              )}
              <Link href="/posts/create" className={linkBase}>
                New post
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearToken();
                  window.location.href = "/";
                }}
                className={linkBase}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={pathname === "/login" ? linkActive : linkBase}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={pathname === "/register" ? linkActive : linkBase}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

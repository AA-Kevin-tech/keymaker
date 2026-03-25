"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

const linkBase =
  "text-sm text-meta hover:text-gray-900 transition-colors";
const linkActive = "text-sm font-medium text-link";

export function Navbar() {
  const pathname = usePathname();
  const token = getToken();
  const { user } = useCurrentUser();

  return (
    <nav className="sticky top-0 z-20 h-12 border-b border-subtle bg-elevated">
      <div className="flex h-full items-center justify-between max-w-6xl mx-auto px-4">
        <Link href="/" className="font-semibold text-base text-gray-900">
          Keymaker
        </Link>
        <div className="flex items-center gap-4">
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
                  className={linkBase}
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

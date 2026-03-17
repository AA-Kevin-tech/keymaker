"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

export function Navbar() {
  const pathname = usePathname();
  const token = getToken();
  const { user } = useCurrentUser();

  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="font-semibold text-lg text-gray-900">
          Keymaker
        </Link>
        <div className="flex gap-4">
          <Link
            href="/communities"
            className={
              pathname?.startsWith("/communities")
                ? "text-blue-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }
          >
            Communities
          </Link>
          {token ? (
            <>
              {user && (
                <Link
                  href={`/users/${user.username}`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {user.username}
                </Link>
              )}
              <Link
                href="/posts/create"
                className="text-gray-600 hover:text-gray-900"
              >
                New post
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearToken();
                  window.location.href = "/";
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={
                  pathname === "/login"
                    ? "text-blue-600 font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={
                  pathname === "/register"
                    ? "text-blue-600 font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }
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

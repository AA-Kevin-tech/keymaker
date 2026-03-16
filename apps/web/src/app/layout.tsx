import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { PageShell } from "@/components/layout/PageShell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Keymaker",
  description: "Four-axis evaluation: clarity, evidence, kindness, novelty.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}

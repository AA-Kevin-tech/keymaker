import Link from "next/link";

export default function HomePage() {
  return (
    <main className="py-8">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Keymaker</h1>
      <p className="mb-6 text-meta">
        Rate content on four axes: clarity, evidence, kindness, novelty.
      </p>
      <Link href="/communities" className="font-medium text-link hover:underline">
        Browse communities →
      </Link>
    </main>
  );
}

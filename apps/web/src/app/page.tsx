import Link from "next/link";

export default function HomePage() {
  return (
    <main className="py-8">
      <h1 className="text-2xl font-semibold mb-4">Keymaker</h1>
      <p className="text-gray-600 mb-6">
        Rate content on four axes: clarity, evidence, kindness, novelty.
      </p>
      <Link
        href="/communities"
        className="text-blue-600 hover:underline font-medium"
      >
        Browse communities →
      </Link>
    </main>
  );
}

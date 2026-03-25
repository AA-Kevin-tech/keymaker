import Link from "next/link";

export default function HomePage() {
  return (
    <main className="py-8">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-ink">
        Keymaker
      </h1>
      <p className="mb-6 max-w-xl text-meta">
        Rate content on four axes: clarity, evidence, kindness, novelty.
      </p>
      <Link
        href="/communities"
        className="font-medium text-link hover:underline"
      >
        Browse communities →
      </Link>
    </main>
  );
}

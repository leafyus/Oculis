"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but sign-in failed. Please sign in manually.");
      router.push("/sign-in");
    } else {
      router.push("/scan");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 justify-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-zinc-900">Oculis</span>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Create your account</h1>
        <p className="text-zinc-500 mt-1">Start scanning for free — no credit card required</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm space-y-5"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Name <span className="text-zinc-400">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="At least 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? "Creating account…" : "Create Free Account"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-violet-600 hover:text-violet-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

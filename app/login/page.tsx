"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to sign you in. Please try again."
        );
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign you in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/login"
            className="group inline-flex items-center gap-3"
            aria-label="myFolks"
          >
            <span className="text-[25px] font-extrabold tracking-[-0.055em] text-[var(--ink)] transition-opacity duration-300 group-hover:opacity-75">
              myFolks
            </span>

            <span className="hidden border-l border-[var(--line)] pl-3 text-sm font-medium text-[var(--muted)] sm:block">
              Find common ground.
            </span>
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[440px] animate-page-in">
            <div className="mb-8 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--coral)]">
                Welcome back
              </p>

              <h1 className="text-[clamp(2.2rem,7vw,3.5rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-[var(--ink)]">
                Find your people.
              </h1>

              <p className="mx-auto mt-4 max-w-[360px] text-[15px] leading-7 text-[var(--muted)]">
                Sign in to keep discovering people through the interests you
                have in common.
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(37,33,31,0.08)] sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="identifier"
                    className="mb-2 block text-sm font-semibold text-[var(--ink)]"
                  >
                    Username or email
                  </label>

                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="your username or email"
                    disabled={isSubmitting}
                    required
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-[15px] text-[var(--ink)] outline-none transition-all duration-300 placeholder:text-[#aaa29b] hover:border-[#d8cec4] focus:border-[var(--coral)] focus:ring-4 focus:ring-[rgba(232,93,74,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-[var(--ink)]"
                    >
                      Password
                    </label>
                  </div>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    required
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-[15px] text-[var(--ink)] outline-none transition-all duration-300 placeholder:text-[#aaa29b] hover:border-[#d8cec4] focus:border-[var(--coral)] focus:ring-4 focus:ring-[rgba(232,93,74,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-[#efc5bd] bg-[var(--danger-bg)] px-4 py-3.5 text-sm leading-6 text-[var(--danger)] animate-fade-up"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full overflow-hidden rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,33,31,0.16)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                >
                  <span className="relative z-10">
                    {isSubmitting ? "Signing you in…" : "Sign in"}
                  </span>
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[var(--line)]" />

                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a49b94]">
                  or
                </span>

                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <p className="text-center text-sm text-[var(--muted)]">
                New to myFolks?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-[var(--ink)] underline decoration-[var(--coral)] decoration-2 underline-offset-4 transition-colors duration-300 hover:text-[var(--coral)]"
                >
                  Create an account
                </Link>
              </p>
            </div>

            <p className="mx-auto mt-6 max-w-[360px] text-center text-xs leading-5 text-[#938a83]">
              myFolks is for finding common ground. Only share what you are
              comfortable making public.
            </p>
          </div>
        </section>

        <footer className="pb-2 text-center text-xs text-[#938a83]">
          © {new Date().getFullYear()} myFolks
        </footer>
      </div>
    </main>
  );
}
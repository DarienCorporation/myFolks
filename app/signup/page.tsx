"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(trimmedUsername)) {
      setError(
        "Username must be 3–30 characters and use only lowercase letters, numbers, and underscores."
      );
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          username: trimmedUsername,
          email: trimmedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create your account. Please try again."
        );
      }

      router.push("/create-profile");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again."
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
            href="/signup"
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
          <div className="w-full max-w-[480px] animate-page-in">
            <div className="mb-8 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--coral)]">
                Join myFolks
              </p>

              <h1 className="text-[clamp(2.2rem,7vw,3.5rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-[var(--ink)]">
                Find your people.
              </h1>

              <p className="mx-auto mt-4 max-w-[380px] text-[15px] leading-7 text-[var(--muted)]">
                Create your account, then choose the interests you are
                comfortable sharing with the myFolks community.
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(37,33,31,0.08)] sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-[var(--ink)]"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    disabled={isSubmitting}
                    required
                    maxLength={60}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-[15px] text-[var(--ink)] outline-none transition-all duration-300 placeholder:text-[#aaa29b] hover:border-[#d8cec4] focus:border-[var(--coral)] focus:ring-4 focus:ring-[rgba(232,93,74,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold text-[var(--ink)]"
                  >
                    Username
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#aaa29b]">
                      @
                    </span>

                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(event) =>
                        setUsername(event.target.value.toLowerCase())
                      }
                      placeholder="yourusername"
                      disabled={isSubmitting}
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-z0-9_]+"
                      className="w-full rounded-2xl border border-[var(--line)] bg-white py-3.5 pl-9 pr-4 text-[15px] text-[var(--ink)] outline-none transition-all duration-300 placeholder:text-[#aaa29b] hover:border-[#d8cec4] focus:border-[var(--coral)] focus:ring-4 focus:ring-[rgba(232,93,74,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#938a83]">
                    3–30 characters. Lowercase letters, numbers, and
                    underscores only.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-[var(--ink)]"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    required
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-[15px] text-[var(--ink)] outline-none transition-all duration-300 placeholder:text-[#aaa29b] hover:border-[#d8cec4] focus:border-[var(--coral)] focus:ring-4 focus:ring-[rgba(232,93,74,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[var(--ink)]"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    disabled={isSubmitting}
                    required
                    minLength={8}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-[15px] text-[var(--ink)] outline-none transition-all duration-300 placeholder:text-[#aaa29b] hover:border-[#d8cec4] focus:border-[var(--coral)] focus:ring-4 focus:ring-[rgba(232,93,74,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-[var(--ink)]"
                  >
                    Confirm password
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Enter your password again"
                    disabled={isSubmitting}
                    required
                    minLength={8}
                    className={[
                      "w-full rounded-2xl border bg-white px-4 py-3.5 text-[15px]",
                      "text-[var(--ink)] outline-none transition-all duration-300",
                      "placeholder:text-[#aaa29b]",
                      "hover:border-[#d8cec4]",
                      "focus:border-[var(--coral)] focus:ring-4 focus:ring-[rgba(232,93,74,0.10)]",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      confirmPassword.length > 0 &&
                      password !== confirmPassword
                        ? "border-[#efc5bd]"
                        : "border-[var(--line)]",
                    ].join(" ")}
                  />

                  {confirmPassword.length > 0 &&
                    password === confirmPassword && (
                      <p className="mt-2 text-xs font-medium text-[var(--success)] animate-fade-up">
                        Passwords match.
                      </p>
                    )}
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
                  className="w-full rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,33,31,0.16)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                >
                  {isSubmitting ? "Creating your account…" : "Create account"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[var(--line)]" />

                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a49b94]">
                  already here?
                </span>

                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>

              <p className="text-center text-sm text-[var(--muted)]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[var(--ink)] underline decoration-[var(--coral)] decoration-2 underline-offset-4 transition-colors duration-300 hover:text-[var(--coral)]"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <p className="mx-auto mt-6 max-w-[390px] text-center text-xs leading-5 text-[#938a83]">
              Only share what you are comfortable making public. You can
              control your profile visibility and connection settings later.
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
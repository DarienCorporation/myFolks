"use client";

import { FormEvent, useEffect, useState } from "react";

const interestSuggestions = [
  "Photography",
  "Astronomy",
  "Music",
  "Programming",
  "Reading",
  "Languages",
  "Cooking",
  "Gaming",
  "Art",
  "Science",
  "Travel",
  "Fitness",
];

type ProfileResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  interests: string[];
  featuredInterest: string;
  visibility: "public" | "private";
  messagePermission: "friends" | "anyone" | "nobody";
  friendRequestNotifications: boolean;
  messageNotifications: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function CreateProfilePage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [featuredInterest, setFeaturedInterest] = useState("");
  const [messagePermission, setMessagePermission] = useState<
    "friends" | "anyone" | "nobody"
  >("friends");
  const [visibility, setVisibility] = useState<"public" | "private">(
    "public"
  );

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/profiles/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          if (response.status === 401) {
            setError("You need to sign in before creating your profile.");
          } else {
            setError(
              data?.error || "Unable to load your profile right now."
            );
          }

          return;
        }

        const profile: ProfileResponse = data.profile;

        setName(profile.name || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setInterests(profile.interests || []);
        setFeaturedInterest(profile.featuredInterest || "");
        setMessagePermission(profile.messagePermission || "friends");
        setVisibility(profile.visibility || "public");
      } catch (loadError) {
        console.error("Load profile error:", loadError);

        if (!cancelled) {
          setError(
            "We couldn't connect to your account. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleInterest = (interest: string) => {
    setError("");

    setInterests((current) => {
      if (current.includes(interest)) {
        const next = current.filter((item) => item !== interest);

        if (featuredInterest === interest) {
          setFeaturedInterest(next[0] || "");
        }

        return next;
      }

      if (current.length >= 8) {
        return current;
      }

      return [...current, interest];
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) return;

    setError("");

    const cleanName = name.trim();
    const cleanBio = bio.trim();
    const cleanFeaturedInterest = featuredInterest.trim();

    if (!cleanName) {
      setError("Please enter your display name.");
      return;
    }

    if (interests.length === 0) {
      setError("Choose at least one interest.");
      return;
    }

    if (
      cleanFeaturedInterest &&
      !interests.includes(cleanFeaturedInterest)
    ) {
      setError("Your featured interest must be one of your selected interests.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          bio: cleanBio,
          interests,
          featuredInterest: cleanFeaturedInterest,
          visibility,
          messagePermission,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired. Please sign in again.");
        } else {
          setError(
            data?.error || "Unable to save your profile right now."
          );
        }

        return;
      }

      const profile: ProfileResponse | undefined = data.profile;

      if (profile) {
        setName(profile.name || cleanName);
        setUsername(profile.username || username);
        setBio(profile.bio || cleanBio);
        setInterests(profile.interests || interests);
        setFeaturedInterest(
          profile.featuredInterest || cleanFeaturedInterest
        );
        setMessagePermission(profile.messagePermission || messagePermission);
        setVisibility(profile.visibility || visibility);
      }

      setSaved(true);
    } catch (saveError) {
      console.error("Save profile error:", saveError);

      setError(
        "We couldn't save your profile. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const editProfile = () => {
    setSaved(false);
    setError("");
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <header className="border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm">
          <div className="mx-auto flex min-h-[76px] max-w-[1180px] items-center justify-between gap-6 px-5 sm:px-8">
            <a
              href="/"
              className="group flex shrink-0 items-center gap-3"
              aria-label="Go to myFolks"
            >
              <span className="text-[25px] font-extrabold tracking-[-0.055em] text-[var(--ink)] transition-opacity duration-300 group-hover:opacity-75">
                myFolks
              </span>

              <span className="hidden border-l border-[var(--line)] pl-3 text-sm font-medium text-[var(--muted)] sm:block">
                Find common ground.
              </span>
            </a>
          </div>
        </header>

        <div className="mx-auto flex min-h-[70vh] max-w-[900px] items-center justify-center px-5 py-12 sm:px-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--coral)]" />

            <p className="mt-5 text-sm font-semibold text-[var(--muted)]">
              Loading your profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[76px] max-w-[1180px] items-center justify-between gap-6 px-5 sm:px-8">
          <a
            href="/"
            className="group flex shrink-0 items-center gap-3"
            aria-label="Go to myFolks"
          >
            <span className="text-[25px] font-extrabold tracking-[-0.055em] text-[var(--ink)] transition-opacity duration-300 group-hover:opacity-75">
              myFolks
            </span>

            <span className="hidden border-l border-[var(--line)] pl-3 text-sm font-medium text-[var(--muted)] sm:block">
              Find common ground.
            </span>
          </a>

          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--mist)] hover:text-[var(--ink)]"
          >
            Back to Discover
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-5 py-12 sm:px-8 sm:py-16">
        {/* Intro */}
        <section className="animate-page-in">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--coral)]">
            Your profile
          </p>

          <h1 className="max-w-[720px] text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-[var(--ink)] sm:text-5xl">
            Tell people what makes you, you.
          </h1>

          <p className="mt-5 max-w-[650px] text-base leading-7 text-[var(--muted)] sm:text-lg">
            Share a little about yourself and choose the interests you want
            people to discover. Only information you make public will appear
            in discovery.
          </p>
        </section>

        {/* Privacy notice */}
        <section className="animate-fade-up animation-delay-100 mt-8 rounded-[22px] border border-[var(--line)] bg-[var(--lavender)]/55 p-5 shadow-[0_10px_30px_rgba(37,33,31,0.04)] sm:p-6">
          <div className="flex gap-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] text-sm font-extrabold text-[var(--ink)] shadow-sm">
              i
            </div>

            <div>
              <h2 className="font-bold text-[var(--ink)]">
                Share only what you are comfortable making public.
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
                Your private account information will not be shown in
                Discover. You control what other people can see.
              </p>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="animate-fade-up mt-5 rounded-[18px] border border-[var(--danger-bg)] bg-[var(--danger-bg)] px-5 py-4 text-sm font-semibold leading-6 text-[var(--danger)]"
          >
            {error}
          </div>
        )}

        {saved ? (
          <section className="animate-completion-in mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8 text-center shadow-[0_18px_50px_rgba(37,33,31,0.08)] sm:p-12">
            <div className="animate-success-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-bg)] text-2xl font-bold text-[var(--success)]">
              ✓
            </div>

            <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.035em] text-[var(--ink)]">
              Your profile is ready.
            </h2>

            <p className="mx-auto mt-3 max-w-[520px] text-base leading-7 text-[var(--muted)]">
              Your profile has been saved securely to your myFolks account.
              You can change these details whenever you want.
            </p>

            <div className="mx-auto mt-7 max-w-md rounded-[20px] border border-[var(--line)] bg-[var(--mist)]/60 p-5 text-left">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Your profile
                  </p>

                  <p className="mt-1 text-lg font-bold text-[var(--ink)]">
                    {name}
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    @{username}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--lavender)] text-lg font-extrabold text-[var(--ink)]">
                  {name.trim().charAt(0).toUpperCase() || "?"}
                </div>
              </div>

              {featuredInterest && (
                <div className="mt-4 rounded-[16px] bg-white/70 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                    Featured interest
                  </p>

                  <p className="mt-1.5 text-sm font-bold text-[var(--ink)]">
                    {featuredInterest}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/"
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--coral)] hover:shadow-[0_12px_26px_rgba(37,33,31,0.18)]"
              >
                Go to Discover
              </a>

              <button
                type="button"
                onClick={editProfile}
                className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-6 py-3 text-sm font-bold text-[var(--ink)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--mist)]"
              >
                Edit profile
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Basic information */}
            <section className="animate-card-in animation-delay-200 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_14px_40px_rgba(37,33,31,0.055)] sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                  01
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[var(--ink)]">
                  The basics
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  These are the details people will use to recognize your
                  profile.
                </p>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--ink)]">
                    Display name
                  </span>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    maxLength={60}
                    required
                    disabled={saving}
                    className="w-full rounded-2xl border border-[var(--line)] bg-[var(--mist)] px-4 py-3.5 text-[var(--ink)] outline-none transition-all duration-300 placeholder:text-[var(--muted)] focus:border-[var(--ink)] focus:bg-[var(--paper)] focus:ring-4 focus:ring-[var(--lavender)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--ink)]">
                    Username
                  </span>

                  <div className="flex overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--mist)] opacity-75">
                    <span className="flex items-center pl-4 text-sm font-bold text-[var(--muted)]">
                      @
                    </span>

                    <input
                      type="text"
                      value={username}
                      readOnly
                      aria-readonly="true"
                      className="min-w-0 flex-1 cursor-not-allowed bg-transparent px-2 py-3.5 text-[var(--ink)] outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    Your username is tied to your account and cannot be changed
                    here.
                  </p>
                </label>
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-[var(--ink)]">
                  Short bio
                </span>

                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="A few words about yourself..."
                  maxLength={240}
                  rows={4}
                  disabled={saving}
                  className="w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--mist)] px-4 py-3.5 text-[var(--ink)] outline-none transition-all duration-300 placeholder:text-[var(--muted)] focus:border-[var(--ink)] focus:bg-[var(--paper)] focus:ring-4 focus:ring-[var(--lavender)] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-2 flex justify-end text-xs text-[var(--muted)]">
                  {bio.length}/240
                </div>
              </label>
            </section>

            {/* Interests */}
            <section className="animate-card-in animation-delay-300 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_14px_40px_rgba(37,33,31,0.055)] sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                  02
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[var(--ink)]">
                  Your interests
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Pick up to eight things you genuinely enjoy. These will help
                  myFolks find common ground between people.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {interestSuggestions.map((interest) => {
                  const selected = interests.includes(interest);

                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      disabled={saving}
                      className={[
                        "rounded-full border px-4 py-2.5 text-sm font-semibold",
                        "transition-all duration-300",
                        selected
                          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] shadow-[0_5px_14px_rgba(37,33,31,0.12)]"
                          : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:-translate-y-0.5 hover:border-[var(--ink)] hover:text-[var(--ink)]",
                        saving ? "cursor-not-allowed opacity-60" : "",
                      ].join(" ")}
                    >
                      {selected ? "✓ " : ""}
                      {interest}
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-[var(--muted)]">
                {interests.length}/8 selected
              </p>

              <div className="mt-7 border-t border-[var(--line)] pt-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--ink)]">
                    Featured interest
                  </span>

                  <select
                    value={featuredInterest}
                    onChange={(event) =>
                      setFeaturedInterest(event.target.value)
                    }
                    disabled={interests.length === 0 || saving}
                    className="w-full rounded-2xl border border-[var(--line)] bg-[var(--mist)] px-4 py-3.5 text-[var(--ink)] outline-none transition-all duration-300 focus:border-[var(--ink)] focus:bg-[var(--paper)] focus:ring-4 focus:ring-[var(--lavender)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      Choose the interest you want people to discover
                    </option>

                    {interests.map((interest) => (
                      <option key={interest} value={interest}>
                        {interest}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  This is the interest that can appear in Discover.
                </p>
              </div>
            </section>

            {/* Privacy */}
            <section className="animate-card-in animation-delay-400 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_14px_40px_rgba(37,33,31,0.055)] sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--muted)]">
                  03
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[var(--ink)]">
                  Privacy & connection
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  You stay in control of how people can interact with you.
                </p>
              </div>

              <div className="mt-7 space-y-6">
                <fieldset>
                  <legend className="text-sm font-bold text-[var(--ink)]">
                    Profile visibility
                  </legend>

                  <div className="mt-3 space-y-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] p-4 transition-all duration-300 hover:bg-[var(--mist)]">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={visibility === "public"}
                        onChange={() => setVisibility("public")}
                        disabled={saving}
                        className="mt-1 accent-[var(--ink)]"
                      />

                      <span>
                        <span className="block text-sm font-bold text-[var(--ink)]">
                          Public
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          Your profile can appear in Discover.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] p-4 transition-all duration-300 hover:bg-[var(--mist)]">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={visibility === "private"}
                        onChange={() => setVisibility("private")}
                        disabled={saving}
                        className="mt-1 accent-[var(--ink)]"
                      />

                      <span>
                        <span className="block text-sm font-bold text-[var(--ink)]">
                          Private
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          Your profile will not appear in Discover.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-bold text-[var(--ink)]">
                    Who can message you?
                  </legend>

                  <div className="mt-3 space-y-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] p-4 transition-all duration-300 hover:bg-[var(--mist)]">
                      <input
                        type="radio"
                        name="messagePermission"
                        value="friends"
                        checked={messagePermission === "friends"}
                        onChange={() => setMessagePermission("friends")}
                        disabled={saving}
                        className="mt-1 accent-[var(--ink)]"
                      />

                      <span>
                        <span className="block text-sm font-bold text-[var(--ink)]">
                          Friends only
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          Only people you connect with can message you.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] p-4 transition-all duration-300 hover:bg-[var(--mist)]">
                      <input
                        type="radio"
                        name="messagePermission"
                        value="anyone"
                        checked={messagePermission === "anyone"}
                        onChange={() => setMessagePermission("anyone")}
                        disabled={saving}
                        className="mt-1 accent-[var(--ink)]"
                      />

                      <span>
                        <span className="block text-sm font-bold text-[var(--ink)]">
                          People on myFolks
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          People can message you according to your profile
                          permissions.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] p-4 transition-all duration-300 hover:bg-[var(--mist)]">
                      <input
                        type="radio"
                        name="messagePermission"
                        value="nobody"
                        checked={messagePermission === "nobody"}
                        onChange={() => setMessagePermission("nobody")}
                        disabled={saving}
                        className="mt-1 accent-[var(--ink)]"
                      />

                      <span>
                        <span className="block text-sm font-bold text-[var(--ink)]">
                          Nobody
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          Messaging will be disabled for your profile.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
              </div>
            </section>

            {/* Submit */}
            <section className="animate-fade-up animation-delay-500 flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[var(--muted)]">
                You can change these settings later.
              </p>

              <button
                type="submit"
                disabled={
                  saving ||
                  !name.trim() ||
                  !username.trim() ||
                  interests.length === 0
                }
                className="rounded-full bg-[var(--coral)] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(232,93,74,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(232,93,74,0.26)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                {saving ? "Saving your profile..." : "Save my profile"}
              </button>
            </section>
          </form>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-[var(--line)] pt-7 text-center">
          <p className="text-xs leading-5 text-[var(--muted)]">
            myFolks is for finding common ground. Only share what you are
            comfortable making public.
          </p>
        </footer>
      </div>
    </main>
  );
}
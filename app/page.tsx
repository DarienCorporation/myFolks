"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import Header from "@/components/Header";

const API = {
  discover: "/api/profiles/discover",
};

const INTRO_STORAGE_KEY = "myfolks_discovery_intro_seen";

type Profile = {
  id: string;
  name: string;
  username: string;
  featuredInterest: string;
  bio: string;
  initials: string;
  allowsMessages: boolean;
};

type DiscoverResponse = {
  success?: boolean;
  anchor?: Profile | null;
  challenger?: Profile | null;
  exhausted?: boolean;
  error?: string;
};

type DiscoveryAction = "selected" | "skipped";

type PageState =
  | "loading"
  | "ready"
  | "exhausted"
  | "unauthenticated"
  | "error";

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function normalizeProfile(profile: Profile | null | undefined): Profile | null {
  if (!profile) return null;

  return {
    ...profile,
    initials:
      profile.initials ||
      getInitials(profile.name || profile.username || "?"),
    bio: profile.bio || "",
    featuredInterest: profile.featuredInterest || "",
    allowsMessages:
      typeof profile.allowsMessages === "boolean"
        ? profile.allowsMessages
        : true,
  };
}

function ProfileCard({
  profile,
  side,
  leaving,
  incoming,
  disabled,
  onSelect,
  onReport,
  onBlock,
}: {
  profile: Profile;
  side: "anchor" | "challenger";
  leaving: boolean;
  incoming: boolean;
  disabled: boolean;
  onSelect: () => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  const isAnchor = side === "anchor";

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--paper)]",
        "shadow-[0_18px_45px_rgba(37,33,31,0.075)]",
        "transition-all duration-[260ms]",
        "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        leaving
          ? isAnchor
            ? "-translate-x-8 opacity-0"
            : "translate-x-8 opacity-0"
          : "",
        incoming ? "animate-card-in" : "",
        disabled ? "pointer-events-none" : "",
      ].join(" ")}
    >
      <div className="p-6 sm:p-7">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[var(--lavender)] text-sm font-extrabold tracking-[-0.02em] text-[var(--ink)] shadow-[inset_0_0_0_1px_rgba(37,33,31,0.04)]">
              {profile.initials}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                {isAnchor ? "Your current pick" : "A myFolks profile"}
              </p>

              <h2 className="mt-1 truncate text-xl font-extrabold tracking-[-0.035em] text-[var(--ink)]">
                {profile.name}
              </h2>

              <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                @{profile.username}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--mist)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
            {isAnchor ? "Stays" : "New"}
          </div>
        </div>

        <div className="rounded-[24px] bg-[var(--mist)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--coral)]">
            Featured interest
          </p>

          <p className="mt-3 text-[20px] font-bold leading-8 tracking-[-0.025em] text-[var(--ink)]">
            {profile.featuredInterest}
          </p>
        </div>

        {profile.bio && (
          <p className="mt-5 text-[15px] leading-7 text-[var(--muted)]">
            {profile.bio}
          </p>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          className="mt-6 w-full rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,33,31,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          I relate to this
        </button>

        <div className="mt-4 flex items-center justify-center gap-5">
          {isAnchor && (
            <>
              <button
                type="button"
                disabled={disabled}
                className="text-xs font-semibold text-[var(--muted)] transition-colors duration-300 hover:text-[var(--ink)] disabled:opacity-50"
                onClick={() => {
                  // Messaging will be connected to the real messaging flow.
                }}
              >
                {profile.allowsMessages ? "Message" : "Messages off"}
              </button>

              <span className="h-1 w-1 rounded-full bg-[var(--line)]" />

              <button
                type="button"
                disabled={disabled}
                className="text-xs font-semibold text-[var(--muted)] transition-colors duration-300 hover:text-[var(--ink)] disabled:opacity-50"
                onClick={() => {
                  // Friend requests will be connected to the real friends flow.
                }}
              >
                Add friend
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-5 border-t border-[var(--line)] pt-4">
          <button
            type="button"
            disabled={disabled}
            onClick={onReport}
            className="text-xs font-medium text-[var(--muted)] transition-colors duration-300 hover:text-[var(--danger)] disabled:opacity-50"
          >
            Report
          </button>

          <span className="h-1 w-1 rounded-full bg-[var(--line)]" />

          <button
            type="button"
            disabled={disabled}
            onClick={onBlock}
            className="text-xs font-medium text-[var(--muted)] transition-colors duration-300 hover:text-[var(--danger)] disabled:opacity-50"
          >
            Block
          </button>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="py-16 text-center animate-fade-up">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--lavender)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--ink)]" />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">
        Discover
      </p>

      <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[var(--ink)] sm:text-3xl">
        Finding people you might connect with…
      </h2>

      <p className="mx-auto mt-3 max-w-[430px] text-sm leading-6 text-[var(--muted)]">
        We&apos;re looking for public profiles with interests you can discover
        together.
      </p>
    </div>
  );
}

function ExhaustedState({
  onRefresh,
  onCreateProfile,
}: {
  onRefresh: () => void;
  onCreateProfile: () => void;
}) {
  return (
    <div className="py-14 text-center animate-page-in">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--lavender)] text-xl font-extrabold text-[var(--ink)]">
        +
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">
        Growing the community
      </p>

      <h2 className="mx-auto mt-3 max-w-[600px] text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1] tracking-[-0.055em] text-[var(--ink)]">
        More people are needed.
      </h2>

      <p className="mx-auto mt-5 max-w-[500px] text-[15px] leading-7 text-[var(--muted)]">
        There aren&apos;t enough public profiles available yet to start a
        discovery comparison. As more people join myFolks, you&apos;ll be able
        to keep discovering common ground.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,33,31,0.15)]"
        >
          Refresh discovery
        </button>

        <button
          type="button"
          onClick={onCreateProfile}
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-3.5 text-sm font-bold text-[var(--ink)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--mist)]"
        >
          Invite people
        </button>
      </div>

      <p className="mx-auto mt-6 max-w-[430px] text-xs leading-5 text-[#938a83]">
        You don&apos;t need to add anything else to your own profile. This
        message simply means there aren&apos;t enough other eligible profiles
        yet.
      </p>
    </div>
  );
}

function UnauthenticatedState() {
  return (
    <div className="py-14 text-center animate-page-in">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">
        Welcome to myFolks
      </p>

      <h2 className="mx-auto mt-3 max-w-[600px] text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1] tracking-[-0.055em] text-[var(--ink)]">
        Sign in to discover your people.
      </h2>

      <p className="mx-auto mt-5 max-w-[500px] text-[15px] leading-7 text-[var(--muted)]">
        Create an account or sign in to start finding common ground through
        shared interests.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,33,31,0.15)]"
        >
          Sign in
        </Link>

        <Link
          href="/signup"
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-5 py-3.5 text-sm font-bold text-[var(--ink)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--mist)]"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-14 text-center animate-page-in">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--danger)]">
        Something went wrong
      </p>

      <h2 className="mx-auto mt-3 max-w-[600px] text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1] tracking-[-0.055em] text-[var(--ink)]">
        We couldn&apos;t load Discover.
      </h2>

      <p className="mx-auto mt-5 max-w-[500px] text-[15px] leading-7 text-[var(--muted)]">
        Your profile is safe. Try loading discovery again.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-8 rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,33,31,0.15)]"
      >
        Try again
      </button>
    </div>
  );
}

export default function HomePage() {
  const [activePage, setActivePage] = useState("discover");

  const [pageState, setPageState] = useState<PageState>("loading");

  const [anchor, setAnchor] = useState<Profile | null>(null);
  const [challenger, setChallenger] = useState<Profile | null>(null);

  const [comparisonCount, setComparisonCount] = useState(0);

  const [leavingProfileId, setLeavingProfileId] = useState<string | null>(
    null
  );
  const [incomingProfileId, setIncomingProfileId] = useState<string | null>(
    null
  );

  const [actionInProgress, setActionInProgress] = useState(false);

  const [showIntro, setShowIntro] = useState(false);
  const [notice, setNotice] = useState("");

  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDiscovery = useCallback(async () => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }

    setPageState("loading");
    setNotice("");
    setLeavingProfileId(null);
    setIncomingProfileId(null);

    try {
      const response = await fetch(API.discover, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      let data: DiscoverResponse = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        setAnchor(null);
        setChallenger(null);
        setPageState("unauthenticated");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load discovery right now."
        );
      }

      const nextAnchor = normalizeProfile(data.anchor);
      const nextChallenger = normalizeProfile(data.challenger);

      /*
       * This is the important fix.
       *
       * The API can legitimately return:
       *
       * success: true
       * anchor: null
       * challenger: null
       * exhausted: true
       *
       * when there are not enough eligible profiles.
       *
       * That is NOT a loading state.
       */
      if (data.exhausted || !nextAnchor || !nextChallenger) {
        setAnchor(null);
        setChallenger(null);
        setPageState("exhausted");
        return;
      }

      setAnchor(nextAnchor);
      setChallenger(nextChallenger);
      setPageState("ready");
    } catch (error) {
      console.error("Discover loading error:", error);

      setAnchor(null);
      setChallenger(null);
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    const introSeen =
      window.localStorage.getItem(INTRO_STORAGE_KEY) === "true";

    if (!introSeen) {
      setShowIntro(true);
    }

    void loadDiscovery();

    return () => {
      if (actionTimerRef.current) {
        clearTimeout(actionTimerRef.current);
      }
    };
  }, [loadDiscovery]);

  function closeIntro() {
    window.localStorage.setItem(INTRO_STORAGE_KEY, "true");
    setShowIntro(false);
  }

  const handleDiscoveryAction = async (
    selectedProfile: Profile,
    action: DiscoveryAction
  ) => {
    if (
      actionInProgress ||
      pageState !== "ready" ||
      !anchor ||
      !challenger
    ) {
      return;
    }

    setActionInProgress(true);
    setNotice("");

    /*
     * The selected profile becomes the new anchor only when the challenger
     * is selected.
     *
     * Selecting the current anchor keeps the anchor in place.
     * Skipping also keeps the anchor in place.
     */
    const nextAnchor =
      action === "selected" && selectedProfile.id === challenger.id
        ? challenger
        : anchor;

    const oldChallenger = challenger;

    setLeavingProfileId(oldChallenger.id);

    try {
      const response = await fetch(API.discover, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          anchorProfileId: anchor.id,
          challengerProfileId: challenger.id,
          selectedProfileId:
            action === "selected" ? selectedProfile.id : null,
          action,
        }),
      });

      let data: DiscoverResponse = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        setAnchor(null);
        setChallenger(null);
        setPageState("unauthenticated");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to continue discovery right now."
        );
      }

      setComparisonCount((count) => count + 1);

      /*
       * Give the outgoing challenger enough time to leave before inserting
       * the next challenger. The anchor remains visually stable.
       */
      await new Promise<void>((resolve) => {
        actionTimerRef.current = setTimeout(resolve, 260);
      });

      const responseAnchor = normalizeProfile(data.anchor);
      const responseChallenger = normalizeProfile(data.challenger);

      if (data.exhausted || !responseAnchor || !responseChallenger) {
        setAnchor(responseAnchor || nextAnchor);
        setChallenger(null);
        setLeavingProfileId(null);
        setIncomingProfileId(null);
        setPageState("exhausted");
        return;
      }

      setAnchor(responseAnchor || nextAnchor);
      setChallenger(responseChallenger);

      setLeavingProfileId(null);
      setIncomingProfileId(responseChallenger.id);

      setPageState("ready");

      actionTimerRef.current = setTimeout(() => {
        setIncomingProfileId(null);
        actionTimerRef.current = null;
      }, 650);
    } catch (error) {
      console.error("Discovery action error:", error);

      setLeavingProfileId(null);
      setIncomingProfileId(null);

      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to continue discovery."
      );
    } finally {
      setActionInProgress(false);
    }
  };

  function handleReport(profile: Profile) {
    setNotice(
      `Report flow for @${profile.username} will be connected to the safety system.`
    );
  }

  function handleBlock(profile: Profile) {
    setNotice(
      `Block flow for @${profile.username} will be connected to the safety system.`
    );
  }

  function handleNavigation(page: string) {
    setActivePage(page);

    if (page === "discover") {
      return;
    }

    setNotice(
      `${page
        .replace("-", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())} is ready for the next implementation step.`
    );
  }

  const renderDiscoveryContent = () => {
    if (pageState === "loading") {
      return <LoadingState />;
    }

    if (pageState === "unauthenticated") {
      return <UnauthenticatedState />;
    }

    if (pageState === "error") {
      return <ErrorState onRetry={() => void loadDiscovery()} />;
    }

    if (pageState === "exhausted") {
      return (
        <ExhaustedState
          onRefresh={() => void loadDiscovery()}
          onCreateProfile={() => setActivePage("create-profile")}
        />
      );
    }

    if (!anchor || !challenger) {
      return <LoadingState />;
    }

    return (
      <>
        <div className="mb-6 rounded-[24px] border border-[var(--line)] bg-[var(--paper)] px-5 py-4 shadow-[0_10px_30px_rgba(37,33,31,0.045)] sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Your discovery session
              </p>

              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {comparisonCount === 0
                  ? "Your first comparison"
                  : `${comparisonCount} comparison${
                      comparisonCount === 1 ? "" : "s"
                    } made`}
              </p>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--mist)] sm:w-40">
              <div
                className="h-full rounded-full bg-[var(--coral)] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(12, comparisonCount * 8)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[24px] border border-[var(--line)] bg-[var(--lavender)]/60 px-5 py-4 sm:px-6">
          <div className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--coral)]" />

            <p className="text-sm leading-6 text-[var(--ink)]">
              Only share what you&apos;re comfortable making public. myFolks
              never shows private interests, contact details, or exact
              locations in Discover.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <ProfileCard
            profile={anchor}
            side="anchor"
            leaving={leavingProfileId === anchor.id}
            incoming={incomingProfileId === anchor.id}
            disabled={actionInProgress}
            onSelect={() => void handleDiscoveryAction(anchor, "selected")}
            onReport={() => handleReport(anchor)}
            onBlock={() => handleBlock(anchor)}
          />

          <div className="flex items-center justify-center py-1 lg:py-0">
            <div className="flex items-center gap-3 lg:flex-col">
              <div className="h-px w-10 bg-[var(--line)] lg:h-10 lg:w-px" />

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b928b]">
                or
              </span>

              <div className="h-px w-10 bg-[var(--line)] lg:h-10 lg:w-px" />
            </div>
          </div>

          <ProfileCard
            profile={challenger}
            side="challenger"
            leaving={leavingProfileId === challenger.id}
            incoming={incomingProfileId === challenger.id}
            disabled={actionInProgress}
            onSelect={() =>
              void handleDiscoveryAction(challenger, "selected")
            }
            onReport={() => handleReport(challenger)}
            onBlock={() => handleBlock(challenger)}
          />
        </div>

        <div className="mt-7 flex flex-col items-center">
          <button
            type="button"
            disabled={actionInProgress}
            onClick={() => void handleDiscoveryAction(challenger, "skipped")}
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-6 py-3 text-sm font-bold text-[var(--ink)] shadow-[0_6px_18px_rgba(37,33,31,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--mist)] hover:shadow-[0_10px_24px_rgba(37,33,31,0.07)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionInProgress ? "Loading next person…" : "Skip"}
          </button>

          <p className="mt-3 text-xs text-[#938a83]">
            {comparisonCount === 0
              ? "Choose the person whose interest feels more familiar."
              : "Your current pick stays while the next person appears."}
          </p>
        </div>
      </>
    );
  };

  return (
    <>
      <Header activePage={activePage} onNavigate={handleNavigation} />

      <main className="min-h-[calc(100vh-76px)]">
        <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
          {activePage === "discover" ? (
            <>
              <section className="mb-10 animate-page-in">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--coral)]">
                  Shared-interest discovery
                </p>

                <div className="max-w-[760px]">
                  <h1 className="text-[clamp(2.7rem,7vw,5rem)] font-extrabold leading-[0.94] tracking-[-0.06em] text-[var(--ink)]">
                    Which interest feels familiar?
                  </h1>

                  <p className="mt-5 max-w-[650px] text-[16px] leading-7 text-[var(--muted)]">
                    Choose the featured interest you connect with most. It&apos;s
                    about finding common ground, never judging people.
                  </p>
                </div>
              </section>

              <section aria-live="polite">{renderDiscoveryContent()}</section>

              {notice && (
                <div className="mx-auto mt-6 max-w-[760px] rounded-2xl border border-[var(--line)] bg-[var(--mist)] px-4 py-3.5 text-center text-sm leading-6 text-[var(--muted)] animate-fade-up">
                  {notice}
                </div>
              )}
            </>
          ) : (
            <section className="animate-page-in">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--coral)]">
                myFolks
              </p>

              <h1 className="text-[clamp(2.7rem,7vw,5rem)] font-extrabold leading-[0.94] tracking-[-0.06em] text-[var(--ink)]">
                {activePage === "friends"
                  ? "Your connections."
                  : activePage === "messages"
                    ? "Your conversations."
                    : activePage === "create-profile"
                      ? "Create your profile."
                      : activePage === "profile"
                        ? "Your profile."
                        : "Your settings."}
              </h1>

              <p className="mt-5 max-w-[650px] text-[16px] leading-7 text-[var(--muted)]">
                This part of myFolks will be connected to the production
                experience next.
              </p>

              <button
                type="button"
                onClick={() => setActivePage("discover")}
                className="mt-8 rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,33,31,0.15)]"
              >
                Back to Discover
              </button>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--line)] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs leading-5 text-[#938a83]">
            myFolks is for finding common ground.
          </p>

          <p className="max-w-[520px] text-xs leading-5 text-[#938a83] sm:text-right">
            Only share what you are comfortable making public. myFolks never
            shows private interests, contact details, or exact locations in
            Discover.
          </p>
        </div>
      </footer>

      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(37,33,31,0.28)] px-5 py-8 backdrop-blur-sm animate-fade-up">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discovery-intro-title"
            className="w-full max-w-[500px] rounded-[30px] border border-[var(--line)] bg-[var(--paper)] p-7 shadow-[0_28px_80px_rgba(37,33,31,0.18)] sm:p-9"
          >
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--lavender)] text-lg font-extrabold text-[var(--ink)]">
              2
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--coral)]">
              How Discover works
            </p>

            <h2
              id="discovery-intro-title"
              className="mt-3 text-[clamp(2rem,6vw,3rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-[var(--ink)]"
            >
              Find your people.
            </h2>

            <p className="mt-5 text-[15px] leading-7 text-[var(--muted)]">
              You&apos;ll see two people at a time. Choose the interest that
              feels more familiar to you. Your choice stays, while the other
              person leaves and a new person appears.
            </p>

            <div className="mt-6 rounded-[22px] bg-[var(--mist)] p-5">
              <p className="text-sm font-bold text-[var(--ink)]">
                One person stays. One new person appears.
              </p>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Keep choosing as long as you want. There&apos;s no final
                perfect match — just people and interests worth discovering.
              </p>
            </div>

            <button
              type="button"
              onClick={closeIntro}
              className="mt-7 w-full rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-bold text-[var(--paper)] shadow-[0_8px_20px_rgba(37,33,31,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,33,31,0.15)]"
            >
              Start discovering
            </button>
          </div>
        </div>
      )}
    </>
  );
}
"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { categories, interests, type Interest } from "@/data/interests";

type Person = {
  id: string;
  name: string;
  bio: string | null;
  interests: string[];
  categories: string[];
  profileImage: string | null;
  whatsapp: string | null;
  facebook: string | null;
};

type DiscoveryRound = {
  left: Person;
  right: Person;
};

type DiscoveryChoice = {
  winnerId: string;
  loserId: string;
};

const INTRO_SESSION_KEY = "myfolks-intro-completed";
const PROFILE_SESSION_KEY = "myfolks-profile-id";
const TOTAL_ROUNDS = 6;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function normalizePerson(row: any): Person {
  return {
    id: row.id,
    name: row.name ?? "",
    bio: row.bio ?? null,
    interests: Array.isArray(row.interests)
      ? row.interests
      : [],
    categories: Array.isArray(row.categories)
      ? row.categories
      : [],
    profileImage: row.profile_image ?? null,
    whatsapp: row.whatsapp ?? null,
    facebook: row.facebook ?? null,
  };
}

function getCategories(person: Person) {
  const values = new Set(person.categories);

  person.interests.forEach((interest) => {
    const category = categories[interest as Interest];

    if (category) {
      values.add(category);
    }
  });

  return Array.from(values);
}

function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("94")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `94${digits.slice(1)}`;
  }

  return digits;
}

function isValidWhatsAppNumber(value: string) {
  return /^94(7\d{8})$/.test(
    normalizeWhatsAppNumber(value),
  );
}

function createWhatsAppLink(
  phoneNumber: string | null,
  matchedPersonName: string,
) {
  if (
    !phoneNumber ||
    !isValidWhatsAppNumber(phoneNumber)
  ) {
    return null;
  }

  const normalized =
    normalizeWhatsAppNumber(phoneNumber);

  const message =
    `Hey ${matchedPersonName}! ` +
    `We found some common ground on myFolks.`;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(
    message,
  )}`;
}

function findCommonGround(
  currentUser: Person,
  people: Person[],
  choices: DiscoveryChoice[],
) {
  const selectedPeople = choices
    .map((choice) =>
      people.find(
        (person) =>
          person.id === choice.winnerId,
      ),
    )
    .filter(
      (person): person is Person =>
        Boolean(person),
    );

  if (!selectedPeople.length) {
    return null;
  }

  const userInterests = new Set(
    currentUser.interests.map((interest) =>
      interest.toLowerCase(),
    ),
  );

  const userCategories = new Set(
    getCategories(currentUser).map((category) =>
      category.toLowerCase(),
    ),
  );

  const scored = selectedPeople.map((person) => {
    const sharedInterests =
      person.interests.filter((interest) =>
        userInterests.has(
          interest.toLowerCase(),
        ),
      );

    const sharedCategories =
      getCategories(person).filter((category) =>
        userCategories.has(
          category.toLowerCase(),
        ),
      );

    const choiceCount = choices.filter(
      (choice) =>
        choice.winnerId === person.id,
    ).length;

    const score =
      sharedInterests.length * 5 +
      sharedCategories.length * 2 +
      choiceCount * 3;

    return {
      person,
      sharedInterests,
      sharedCategories,
      choiceCount,
      score,
    };
  });

  scored.sort(
    (a, b) => b.score - a.score,
  );

  return scored[0] ?? null;
}

function PersonAvatar({
  person,
  large = false,
}: {
  person: Person;
  large?: boolean;
}) {
  if (person.profileImage) {
    return (
      <img
        src={person.profileImage}
        alt={person.name}
        className={`avatar ${
          large ? "avatar-large" : ""
        }`}
      />
    );
  }

  return (
    <div
      className={`avatar ${
        large ? "avatar-large" : ""
      }`}
      aria-label={`${person.name} profile`}
    >
      {initials(person.name)}
    </div>
  );
}

function PersonCard({
  person,
  onChoose,
}: {
  person: Person;
  onChoose: (person: Person) => void;
}) {
  return (
    <article className="profile-card">
      <div className="profile-card-top">
        <PersonAvatar person={person} />

        <div className="profile-card-identity">
          <h3>{person.name}</h3>
          <span>myFolks member</span>
        </div>
      </div>

      {person.bio && (
        <p className="profile-card-bio">
          {person.bio}
        </p>
      )}

      <div className="featured-interest">
        <span>INTEREST</span>

        <strong>
          {person.interests[0] ??
            "Something worth discovering"}
        </strong>
      </div>

      <button
        type="button"
        className="primary-button full-width"
        onClick={() => onChoose(person)}
      >
        I relate to this
      </button>
    </article>
  );
}

export default function HomePage() {
  const [introReady, setIntroReady] =
    useState(false);

  const [started, setStarted] =
    useState(false);

  const [people, setPeople] =
    useState<Person[]>([]);

  const [currentUser, setCurrentUser] =
    useState<Person | null>(null);

  const [activeView, setActiveView] =
    useState<"discover" | "profile">(
      "discover",
    );

  const [loadingProfiles, setLoadingProfiles] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [discoveryError, setDiscoveryError] =
    useState("");

  const [round, setRound] =
    useState(0);

  const [rounds, setRounds] =
    useState<DiscoveryRound[]>([]);

  const [choices, setChoices] =
    useState<DiscoveryChoice[]>([]);

  const [result, setResult] =
    useState<
      ReturnType<typeof findCommonGround>
    >(null);

  const [profileForm, setProfileForm] =
    useState({
      name: "",
      bio: "",
      whatsapp: "",
      facebook: "",
      interests: [] as string[],
      profileImage: "",
    });

  const currentRound =
    rounds[round];

  const progress =
    round >= TOTAL_ROUNDS
      ? 100
      : (round / TOTAL_ROUNDS) * 100;

  const whatsappLink = useMemo(() => {
    if (!result?.person.whatsapp) {
      return null;
    }

    return createWhatsAppLink(
      result.person.whatsapp,
      result.person.name,
    );
  }, [result]);

  useEffect(() => {
    const completed =
      window.sessionStorage.getItem(
        INTRO_SESSION_KEY,
      ) === "true";

    if (completed) {
      setStarted(true);
    }

    setIntroReady(true);
  }, []);

  useEffect(() => {
    if (!introReady) {
      return;
    }

    loadProfiles();
  }, [introReady]);

  async function loadProfiles() {
    setLoadingProfiles(true);
    setDiscoveryError("");

    const { data, error } =
      await supabase
        .from("people")
        .select(
          "id,name,bio,interests,categories,profile_image,whatsapp,facebook",
        )
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.error(error);

      setDiscoveryError(
        "We couldn't load your folks right now.",
      );

      setLoadingProfiles(false);
      return;
    }

    const normalized =
      (data ?? []).map(
        normalizePerson,
      );

    setPeople(normalized);

    const storedProfileId =
      window.sessionStorage.getItem(
        PROFILE_SESSION_KEY,
      );

    if (storedProfileId) {
      const existing =
        normalized.find(
          (person) =>
            person.id ===
            storedProfileId,
        );

      if (existing) {
        setCurrentUser(existing);

        setProfileForm({
          name: existing.name,
          bio: existing.bio ?? "",
          whatsapp:
            existing.whatsapp ?? "",
          facebook:
            existing.facebook ?? "",
          interests:
            existing.interests,
          profileImage:
            existing.profileImage ?? "",
        });
      }
    }

    setLoadingProfiles(false);
  }

  function startExperience() {
    window.sessionStorage.setItem(
      INTRO_SESSION_KEY,
      "true",
    );

    setStarted(true);
  }

  function generateRounds(
    profileList: Person[],
    user: Person,
  ) {
    const candidates =
      profileList.filter(
        (person) =>
          person.id !== user.id,
      );

    if (candidates.length < 2) {
      return [];
    }

    const shuffled = [...candidates].sort(
      () => Math.random() - 0.5,
    );

    const generated: DiscoveryRound[] =
      [];

    for (
      let index = 0;
      index < TOTAL_ROUNDS;
      index++
    ) {
      const left =
        shuffled[
          index % shuffled.length
        ];

      let right =
        shuffled[
          (index + 1) %
            shuffled.length
        ];

      if (right.id === left.id) {
        right =
          shuffled[
            (index + 2) %
              shuffled.length
          ];
      }

      generated.push({
        left,
        right,
      });
    }

    return generated;
  }

  function beginDiscovery(
    user: Person,
  ) {
    const generated =
      generateRounds(
        people,
        user,
      );

    if (
      generated.length <
      TOTAL_ROUNDS
    ) {
      setDiscoveryError(
        "At least two other people need to create profiles before discovery can begin.",
      );
      return;
    }

    setDiscoveryError("");
    setChoices([]);
    setResult(null);
    setRound(0);
    setRounds(generated);
    setActiveView("discover");
  }

  function choosePerson(
    selected: Person,
  ) {
    if (
      !currentRound ||
      !currentUser
    ) {
      return;
    }

    const other =
      selected.id ===
      currentRound.left.id
        ? currentRound.right
        : currentRound.left;

    const choice: DiscoveryChoice =
      {
        winnerId: selected.id,
        loserId: other.id,
      };

    const updatedChoices = [
      ...choices,
      choice,
    ];

    setChoices(updatedChoices);

    if (
      updatedChoices.length ===
      TOTAL_ROUNDS
    ) {
      const commonGround =
        findCommonGround(
          currentUser,
          people,
          updatedChoices,
        );

      setResult(commonGround);
      setRound(TOTAL_ROUNDS);
      return;
    }

    setRound(
      (previous) =>
        previous + 1,
    );
  }

  function updateProfileField(
    field: keyof typeof profileForm,
    value: string,
  ) {
    setProfileForm(
      (previous) => ({
        ...previous,
        [field]: value,
      }),
    );
  }

  function toggleInterest(
    interest: string,
  ) {
    setProfileForm(
      (previous) => {
        if (
          previous.interests.includes(
            interest,
          )
        ) {
          return {
            ...previous,
            interests:
              previous.interests.filter(
                (item) =>
                  item !==
                  interest,
              ),
          };
        }

        if (
          previous.interests
            .length >= 8
        ) {
          return previous;
        }

        return {
          ...previous,
          interests: [
            ...previous.interests,
            interest,
          ],
        };
      },
    );
  }

  function handleProfileImage(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setProfileError(
        "Please choose an image file.",
      );
      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      setProfileError(
        "Please choose an image smaller than 2 MB.",
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setProfileForm(
        (previous) => ({
          ...previous,
          profileImage:
            String(
              reader.result ??
                "",
            ),
        }),
      );
    };

    reader.readAsDataURL(file);
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setProfileError("");

    const name =
      profileForm.name.trim();

    const bio =
      profileForm.bio.trim();

    const whatsapp =
      profileForm.whatsapp.trim();

    const facebook =
      profileForm.facebook.trim();

    if (!name) {
      setProfileError(
        "Please enter your name.",
      );
      return;
    }

    if (!whatsapp) {
      setProfileError(
        "Your WhatsApp number is required so your friends can connect with you.",
      );
      return;
    }

    if (
      !isValidWhatsAppNumber(
        whatsapp,
      )
    ) {
      setProfileError(
        "Please enter a valid Sri Lankan WhatsApp number, such as 0771234567.",
      );
      return;
    }

    if (
      profileForm.interests
        .length < 2
    ) {
      setProfileError(
        "Please choose at least two interests.",
      );
      return;
    }

    setSavingProfile(true);

    const payload = {
      name,
      bio: bio || null,
      interests:
        profileForm.interests,
      categories: Array.from(
        new Set(
          profileForm.interests
            .map(
              (interest) =>
                categories[
                  interest as Interest
                ],
            )
            .filter(Boolean),
        ),
      ),
      profile_image:
        profileForm.profileImage ||
        null,
      whatsapp:
        normalizeWhatsAppNumber(
          whatsapp,
        ),
      facebook:
        facebook || null,
    };

    let savedPerson:
      | Person
      | null = null;

    if (currentUser) {
      const { data, error } =
        await supabase
          .from("people")
          .update(payload)
          .eq(
            "id",
            currentUser.id,
          )
          .select(
            "id,name,bio,interests,categories,profile_image,whatsapp,facebook",
          )
          .single();

      if (error) {
        console.error(error);

        setProfileError(
          "We couldn't update your profile. Please try again.",
        );

        setSavingProfile(false);
        return;
      }

      savedPerson =
        normalizePerson(data);
    } else {
      const { data, error } =
        await supabase
          .from("people")
          .insert(payload)
          .select(
            "id,name,bio,interests,categories,profile_image,whatsapp,facebook",
          )
          .single();

      if (error) {
        console.error(error);

        setProfileError(
          "We couldn't create your profile. Please try again.",
        );

        setSavingProfile(false);
        return;
      }

      savedPerson =
        normalizePerson(data);
    }

    if (!savedPerson) {
      setProfileError(
        "Something went wrong while saving your profile.",
      );

      setSavingProfile(false);
      return;
    }

    setCurrentUser(
      savedPerson,
    );

    window.sessionStorage.setItem(
      PROFILE_SESSION_KEY,
      savedPerson.id,
    );

    setPeople(
      (previous) => {
        const exists =
          previous.some(
            (person) =>
              person.id ===
              savedPerson!.id,
          );

        if (exists) {
          return previous.map(
            (person) =>
              person.id ===
                savedPerson!.id
                ? savedPerson!
                : person,
          );
        }

        return [
          ...previous,
          savedPerson!,
        ];
      },
    );

    setSavingProfile(false);

    beginDiscovery(
      savedPerson,
    );
  }

  function resetDiscovery() {
    if (!currentUser) {
      return;
    }

    beginDiscovery(
      currentUser,
    );
  }

  if (!introReady) {
    return (
      <div className="app-loading">
        <div className="loading-dot" />
      </div>
    );
  }

  if (!started) {
    return (
      <main className="intro-screen grain">
        <div className="intro-glow intro-glow-one" />
        <div className="intro-glow intro-glow-two" />

        <div className="intro-content">
          <div className="intro-mark">
            m
          </div>

          <p className="eyebrow">
            A place for your people
          </p>

          <h1>
            Find your people.
            <br />
            Find common ground.
          </h1>

          <p className="intro-copy">
            myFolks helps friends
            discover meaningful common
            ground through a few simple
            choices.
          </p>

          <button
            type="button"
            className="primary-button intro-button"
            onClick={
              startExperience
            }
          >
            Discover
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="site-shell grain">
      <header className="site-header">
        <div className="header-inner">
          <button
            type="button"
            className="brand-button"
            onClick={() =>
              setActiveView(
                "discover",
              )
            }
          >
            <span className="brand-symbol">
              m
            </span>

            <span className="brand-name">
              myFolks
            </span>
          </button>

          <nav
            className="site-nav"
            aria-label="Main navigation"
          >
            <button
              type="button"
              className={`nav-link ${
                activeView ===
                "discover"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveView(
                  "discover",
                )
              }
            >
              Discover
            </button>

            <button
              type="button"
              className={`nav-link ${
                activeView ===
                "profile"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveView(
                  "profile",
                )
              }
            >
              My profile
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {activeView ===
        "profile" ? (
          <section className="view-panel profile-view">
            <div className="section-heading">
              <p className="eyebrow">
                Your profile
              </p>

              <h1>
                Tell your folks a
                little about you.
              </h1>

              <p>
                Keep it simple. Your
                profile helps myFolks
                understand what you enjoy
                and find meaningful common
                ground.
              </p>
            </div>

            <form
              className="profile-form"
              onSubmit={
                saveProfile
              }
            >
              <label className="form-field">
                <span>
                  Name <b>*</b>
                </span>

                <input
                  type="text"
                  value={
                    profileForm.name
                  }
                  onChange={(event) =>
                    updateProfileField(
                      "name",
                      event.target
                        .value,
                    )
                  }
                  placeholder="Your name"
                  required
                />
              </label>

              <label className="form-field">
                <span>
                  Bio
                </span>

                <textarea
                  value={
                    profileForm.bio
                  }
                  onChange={(event) =>
                    updateProfileField(
                      "bio",
                      event.target
                        .value,
                    )
                  }
                  placeholder="A short line about you..."
                  rows={4}
                />
              </label>

              <label className="form-field">
                <span>
                  WhatsApp number{" "}
                  <b>*</b>
                </span>

                <input
                  type="tel"
                  value={
                    profileForm.whatsapp
                  }
                  onChange={(event) =>
                    updateProfileField(
                      "whatsapp",
                      event.target
                        .value,
                    )
                  }
                  placeholder="077 123 4567"
                  inputMode="tel"
                  required
                />

                <small>
                  Required so people can
                  connect with you after
                  finding common ground.
                </small>
              </label>

              <label className="form-field">
                <span>
                  Facebook profile
                </span>

                <input
                  type="url"
                  value={
                    profileForm.facebook
                  }
                  onChange={(event) =>
                    updateProfileField(
                      "facebook",
                      event.target
                        .value,
                    )
                  }
                  placeholder="https://facebook.com/..."
                />
              </label>

              <label className="form-field">
                <span>
                  Profile photo
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleProfileImage
                  }
                />

                {profileForm.profileImage && (
                  <div className="profile-image-preview">
                    <img
                      src={
                        profileForm.profileImage
                      }
                      alt="Profile preview"
                    />
                  </div>
                )}
              </label>

              <div className="form-field">
                <div className="field-heading">
                  <span>
                    Interests{" "}
                    <b>*</b>
                  </span>

                  <small>
                    {
                      profileForm
                        .interests
                        .length
                    }
                    /8 selected
                  </small>
                </div>

                <div className="interest-grid">
                  {interests.map(
                    (interest) => {
                      const selected =
                        profileForm.interests.includes(
                          interest,
                        );

                      return (
                        <button
                          key={
                            interest
                          }
                          type="button"
                          className={`interest-chip ${
                            selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            toggleInterest(
                              interest,
                            )
                          }
                        >
                          {interest}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {profileError && (
                <div
                  className="form-error"
                  role="alert"
                >
                  {profileError}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={
                  savingProfile
                }
              >
                {savingProfile
                  ? "Saving..."
                  : currentUser
                    ? "Save profile"
                    : "Create profile"}
              </button>
            </form>
          </section>
        ) : (
          <section className="view-panel discovery-view">
            {!currentUser ? (
              <div className="empty-discovery">
                <p className="eyebrow">
                  Shared-interest
                  discovery
                </p>

                <h1>
                  First, tell us who
                  you are.
                </h1>

                <p>
                  Create your profile and
                  choose a few things you
                  genuinely enjoy. Then
                  myFolks will guide you
                  through six rounds of
                  choices.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    setActiveView(
                      "profile",
                    )
                  }
                >
                  Create my profile
                </button>
              </div>
            ) : result ? (
              <div className="result-section">
                <div className="result-card">
                  <div className="result-spark">
                    ✦
                  </div>

                  <p className="eyebrow">
                    Six choices later
                  </p>

                  <h1>
                    You found
                    <br />
                    common ground.
                  </h1>

                  <div className="result-person">
                    <PersonAvatar
                      person={
                        result.person
                      }
                      large
                    />

                    <div>
                      <h2>
                        {
                          result.person
                            .name
                        }
                      </h2>

                      <span>
                        myFolks member
                      </span>
                    </div>
                  </div>

                  {result.person
                    .bio && (
                    <p className="result-bio">
                      {
                        result
                          .person
                          .bio
                      }
                    </p>
                  )}

                  <div className="result-explanation">
                    <span>
                      WHAT YOU HAVE
                      IN COMMON
                    </span>

                    {result
                      .sharedInterests
                      .length >
                    0 ? (
                      <>
                        <div className="result-tags">
                          {result.sharedInterests.map(
                            (
                              interest,
                            ) => (
                              <span
                                key={
                                  interest
                                }
                              >
                                {
                                  interest
                                }
                              </span>
                            ),
                          )}
                        </div>

                        <p>
                          Your choices kept
                          pointing toward
                          similar interests,
                          especially{" "}
                          <strong>
                            {result.sharedInterests
                              .slice(
                                0,
                                2,
                              )
                              .join(
                                " and ",
                              )}
                          </strong>
                          .
                        </p>
                      </>
                    ) : (
                      <p>
                        Your six choices
                        showed a similar
                        pattern across
                        several areas of
                        interest.
                      </p>
                    )}
                  </div>

                  <div className="result-actions">
                    {whatsappLink ? (
                      <a
                        href={
                          whatsappLink
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="primary-button"
                      >
                        Message on
                        WhatsApp
                      </a>
                    ) : (
                      <div className="connection-warning">
                        This person hasn't
                        added a valid WhatsApp
                        number yet.
                      </div>
                    )}

                    {result.person
                      .facebook && (
                      <a
                        href={
                          result
                            .person
                            .facebook
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary-button"
                      >
                        View Facebook
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    className="text-button"
                    onClick={
                      resetDiscovery
                    }
                  >
                    Discover again
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="section-heading discovery-heading">
                  <p className="eyebrow">
                    Shared-interest
                    discovery
                  </p>

                  <h1>
                    Which interest
                    feels familiar?
                  </h1>

                  <p>
                    Choose the person whose
                    interests feel more like
                    you. We'll use six rounds
                    to understand the pattern
                    behind your choices.
                  </p>
                </div>

                <div className="session-card">
                  <div className="session-card-heading">
                    <span>
                      Discovery session
                    </span>

                    <strong>
                      Round{" "}
                      {Math.min(
                        round + 1,
                        TOTAL_ROUNDS,
                      )}{" "}
                      of{" "}
                      {TOTAL_ROUNDS}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                {discoveryError && (
                  <div
                    className="form-error"
                    role="alert"
                  >
                    {
                      discoveryError
                    }
                  </div>
                )}

                {loadingProfiles ? (
                  <div className="discovery-loading">
                    <div className="loading-dot" />
                    Loading your folks...
                  </div>
                ) : currentRound ? (
                  <div className="pair-section">
                    <div className="pair-grid">
                      <PersonCard
                        person={
                          currentRound.left
                        }
                        onChoose={
                          choosePerson
                        }
                      />

                      <div className="or-divider">
                        <span>
                          OR
                        </span>
                      </div>

                      <PersonCard
                        person={
                          currentRound.right
                        }
                        onChoose={
                          choosePerson
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="empty-discovery">
                    <p>
                      Create at least two
                      other profiles before
                      starting discovery.
                    </p>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        setActiveView(
                          "profile",
                        )
                      }
                    >
                      View my profile
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div>
          <strong>myFolks</strong>

          <span>
            Find your people. Find common
            ground.
          </span>
        </div>
      </footer>
    </div>
  );
}
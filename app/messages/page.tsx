"use client";

import Link from "next/link";
import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

type Person = {
  id: string;
  name: string;
  initials: string;
  interest: string;
  preview: string;
  time: string;
  accent: "coral" | "lavender";
};

type Message = {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
};

const people: Person[] = [
  {
    id: "amara",
    name: "Amara",
    initials: "A",
    interest: "Photography",
    preview:
      "That sounds really interesting.",
    time: "2m",
    accent: "coral",
  },
  {
    id: "daniel",
    name: "Daniel",
    initials: "D",
    interest: "Technology",
    preview:
      "I have been thinking about that too.",
    time: "1h",
    accent: "lavender",
  },
  {
    id: "maya",
    name: "Maya",
    initials: "M",
    interest: "Travel",
    preview:
      "There are so many places to explore.",
    time: "3h",
    accent: "coral",
  },
  {
    id: "noah",
    name: "Noah",
    initials: "N",
    interest: "Music",
    preview:
      "You should check that album out.",
    time: "Yesterday",
    accent: "lavender",
  },
];

const initialMessages: Record<
  string,
  Message[]
> = {
  amara: [
    {
      id: 1,
      sender: "them",
      text:
        "Hey! I noticed we both chose photography during discovery.",
      time: "6:41 PM",
    },
    {
      id: 2,
      sender: "me",
      text:
        "Yeah, I have always liked finding interesting things to capture.",
      time: "6:43 PM",
    },
    {
      id: 3,
      sender: "them",
      text:
        "Same here. I especially like photographing places that most people overlook.",
      time: "6:44 PM",
    },
    {
      id: 4,
      sender: "me",
      text:
        "That sounds really interesting.",
      time: "6:46 PM",
    },
  ],

  daniel: [
    {
      id: 1,
      sender: "them",
      text:
        "I have been thinking about how technology changes the way we learn.",
      time: "5:20 PM",
    },
    {
      id: 2,
      sender: "me",
      text:
        "I think the interesting part is how quickly that is changing.",
      time: "5:23 PM",
    },
  ],

  maya: [
    {
      id: 1,
      sender: "them",
      text:
        "There are so many places I still want to explore.",
      time: "3:12 PM",
    },
  ],

  noah: [
    {
      id: 1,
      sender: "them",
      text:
        "You should check that album out.",
      time: "Yesterday",
    },
  ],
};

export default function MessagesPage() {
  const searchParams =
    useSearchParams();

  const personFromUrl =
    searchParams.get("person");

  const initialPersonId =
    people.some(
      (person) =>
        person.id === personFromUrl,
    )
      ? personFromUrl!
      : people[0].id;

  const [
    selectedPersonId,
    setSelectedPersonId,
  ] = useState(initialPersonId);

  const [messages, setMessages] =
    useState(initialMessages);

  const [messageInput, setMessageInput] =
    useState("");

  const [
    mobileConversationOpen,
    setMobileConversationOpen,
  ] = useState(Boolean(personFromUrl));

  const [
    transitioning,
    setTransitioning,
  ] = useState(false);

  const selectedPerson = useMemo(
    () =>
      people.find(
        (person) =>
          person.id ===
          selectedPersonId,
      ) ?? people[0],
    [selectedPersonId],
  );

  const selectedMessages =
    messages[selectedPerson.id] ?? [];

  function selectPerson(
    personId: string,
  ) {
    setSelectedPersonId(personId);
    setMobileConversationOpen(true);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const text =
      messageInput.trim();

    if (!text) {
      return;
    }

    const newMessage: Message = {
      id: Date.now(),
      sender: "me",
      text,
      time:
        new Date().toLocaleTimeString(
          [],
          {
            hour: "numeric",
            minute: "2-digit",
          },
        ),
    };

    setMessages((current) => ({
      ...current,
      [selectedPerson.id]: [
        ...(current[
          selectedPerson.id
        ] ?? []),
        newMessage,
      ],
    }));

    setMessageInput("");
  }

  function handleDiscoverClick() {
    setTransitioning(true);
  }

  return (
    <main className="messages-page">
      <header className="messages-header">
        <div className="messages-header-inner">
          <Link
            href="/"
            className="messages-brand"
            aria-label="myFolks home"
            onClick={handleDiscoverClick}
          >
            myFolks
          </Link>

          <nav
            className="messages-navigation"
            aria-label="Main navigation"
          >
            <Link
              href="/"
              onClick={handleDiscoverClick}
            >
              Discover
            </Link>

            <Link
              href="/messages"
              className="messages-navigation-active"
            >
              Messages
            </Link>
          </nav>

          <button
            type="button"
            className="messages-profile-button"
            aria-label="Open profile"
          >
            <span className="messages-profile-avatar">
              R
            </span>
          </button>
        </div>
      </header>

      <section className="messages-shell">
        <aside
          className={`conversation-sidebar ${
            mobileConversationOpen
              ? "conversation-sidebar-hidden-mobile"
              : ""
          }`}
        >
          <div className="conversation-sidebar-heading">
            <div>
              <p className="messages-eyebrow">
                Your people
              </p>

              <h1>Messages</h1>
            </div>

            <span className="conversation-count">
              {people.length}
            </span>
          </div>

          <div className="conversation-search">
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              placeholder="Search conversations"
              aria-label="Search conversations"
            />
          </div>

          <div className="conversation-list">
            {people.map((person) => {
              const active =
                person.id ===
                selectedPerson.id;

              return (
                <button
                  type="button"
                  key={person.id}
                  className={`conversation-item ${
                    active
                      ? "conversation-item-active"
                      : ""
                  }`}
                  onClick={() =>
                    selectPerson(
                      person.id,
                    )
                  }
                >
                  <span
                    className={`conversation-avatar conversation-avatar-${person.accent}`}
                  >
                    {person.initials}
                  </span>

                  <span className="conversation-item-content">
                    <span className="conversation-item-top">
                      <strong>
                        {person.name}
                      </strong>

                      <small>
                        {person.time}
                      </small>
                    </span>

                    <span className="conversation-item-interest">
                      {person.interest}
                    </span>

                    <span className="conversation-item-preview">
                      {person.preview}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="conversation-sidebar-footer">
            <p>
              Conversations start from something
              you discovered together.
            </p>
          </div>
        </aside>

        <section
          className={`conversation-panel ${
            mobileConversationOpen
              ? "conversation-panel-mobile-open"
              : ""
          }`}
        >
          <div className="conversation-topbar">
            <button
              type="button"
              className="mobile-back-button"
              onClick={() =>
                setMobileConversationOpen(
                  false,
                )
              }
              aria-label="Back to conversations"
            >
              ←
            </button>

            <div className="conversation-person">
              <span
                className={`conversation-avatar conversation-avatar-${selectedPerson.accent}`}
              >
                {selectedPerson.initials}
              </span>

              <div>
                <h2>
                  {selectedPerson.name}
                </h2>

                <p>
                  Connected through{" "}
                  {selectedPerson.interest}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="conversation-more-button"
              aria-label="More conversation options"
            >
              ···
            </button>
          </div>

          <div className="shared-ground-banner">
            <span className="shared-ground-icon">
              ✦
            </span>

            <div>
              <strong>
                You found common ground
              </strong>

              <span>
                You and{" "}
                {selectedPerson.name}{" "}
                connected through{" "}
                <b>
                  {selectedPerson.interest}
                </b>
                .
              </span>
            </div>
          </div>

          <div className="conversation-messages">
            <div className="conversation-start">
              <div
                className={`profile-photo profile-photo-tiny profile-photo-${selectedPerson.accent}`}
              >
                <span className="profile-photo-placeholder">
                  {
                    selectedPerson.initials
                  }
                </span>
              </div>

              <p>
                This is where your conversation
                with{" "}
                {selectedPerson.name}{" "}
                begins.
              </p>

              <small>
                Connected through{" "}
                {selectedPerson.interest}
              </small>
            </div>

            {selectedMessages.map(
              (message) => (
                <div
                  key={message.id}
                  className={`message-row ${
                    message.sender === "me"
                      ? "message-row-me"
                      : "message-row-them"
                  }`}
                >
                  <div
                    className={`message-bubble ${
                      message.sender === "me"
                        ? "message-bubble-me"
                        : "message-bubble-them"
                    }`}
                  >
                    <p>
                      {message.text}
                    </p>

                    <span>
                      {message.time}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>

          <form
            className="message-composer"
            onSubmit={handleSubmit}
          >
            <div className="composer-input-wrapper">
              <input
                type="text"
                value={messageInput}
                onChange={(event) =>
                  setMessageInput(
                    event.target.value,
                  )
                }
                placeholder={`Message ${selectedPerson.name}...`}
                aria-label={`Message ${selectedPerson.name}`}
              />

              <button
                type="submit"
                className="composer-send-button"
                disabled={
                  !messageInput.trim()
                }
                aria-label="Send message"
              >
                ↑
              </button>
            </div>

            <p className="composer-note">
              Keep the conversation thoughtful
              and respectful.
            </p>
          </form>
        </section>
      </section>

      <footer className="site-footer">
        <span>
          © All rights reserved by{" "}
          <strong>Darien Corporation</strong>
        </span>
      </footer>

      {transitioning && (
        <div className="route-transition">
          <div className="route-transition-mark">
            myFolks
          </div>
        </div>
      )}
    </main>
  );
}
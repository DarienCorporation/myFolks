import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import User from "@/models/User";

function isValidUsername(username: string) {
  return /^[a-z0-9_]{3,30}$/.test(username);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const username =
      typeof body.username === "string"
        ? body.username.trim().toLowerCase()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!name || name.length > 60) {
      return NextResponse.json(
        {
          error: "Please provide a valid name.",
        },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3–30 characters and contain only lowercase letters, numbers, and underscores.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })
      .select("_id username email")
      .lean();

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          {
            error: "That username is already taken.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "An account with that email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      username,
      email,
      passwordHash,
    });

    await createSession(user._id.toString());

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating your account.",
      },
      { status: 500 }
    );
  }
}
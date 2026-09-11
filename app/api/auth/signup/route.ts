import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getDatabase } from "@/lib/mongodb";
import {
  normalizeEmail,
  normalizeUsername,
  type UserDocument,
} from "@/models/User";

type SignupBody = {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;

    const fullName = body.fullName?.trim() ?? "";
    const username = normalizeUsername(body.username ?? "");
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!fullName || !username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Please complete all required fields." },
        { status: 400 },
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Username must be at least 3 characters.",
        },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json(
        {
          success: false,
          error: "Username can only contain letters, numbers, and underscores.",
        },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Passwords do not match.",
        },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const users = db.collection<UserDocument>("users");

    const existingUser = await users.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          {
            success: false,
            error: "That username is already taken.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "An account with that email already exists.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const user: UserDocument = {
      fullName,
      username,
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(user);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.insertedId.toString(),
          fullName,
          username,
          email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create your account right now.",
      },
      { status: 500 },
    );
  }
}
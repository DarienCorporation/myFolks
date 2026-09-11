import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const identifier =
      typeof body.identifier === "string"
        ? body.identifier.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        {
          error: "Please enter your username/email and password.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid username/email or password.",
        },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Invalid username/email or password.",
        },
        { status: 401 }
      );
    }

    await createSession(user._id.toString());

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while signing you in.",
      },
      { status: 500 }
    );
  }
}
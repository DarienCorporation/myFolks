import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId)
      .select(
        "name username email bio interests featuredInterest visibility messagePermission friendRequestNotifications messageNotifications createdAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        interests: user.interests,
        featuredInterest: user.featuredInterest,
        visibility: user.visibility,
        messagePermission: user.messagePermission,
        friendRequestNotifications: user.friendRequestNotifications,
        messageNotifications: user.messageNotifications,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);

    return NextResponse.json(
      {
        error: "Unable to verify your session.",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

const MAX_INTERESTS = 8;

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId)
      .select(
        "name username email bio interests featuredInterest visibility messagePermission friendRequestNotifications messageNotifications createdAt updatedAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
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
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return NextResponse.json(
      { error: "Unable to load your profile." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = cleanString(body.name, 60);
    const bio = cleanString(body.bio, 240);
    const featuredInterest = cleanString(body.featuredInterest, 120);

    const visibility =
      body.visibility === "private" ? "private" : "public";

    const messagePermission =
      body.messagePermission === "anyone" ||
      body.messagePermission === "nobody"
        ? body.messagePermission
        : "friends";

    if (!name) {
      return NextResponse.json(
        { error: "Please provide your name." },
        { status: 400 }
      );
    }

    let interests: string[] = [];

    if (Array.isArray(body.interests)) {
      interests = body.interests
        .filter(
          (interest): interest is string =>
            typeof interest === "string"
        )
        .map((interest) => interest.trim())
        .filter(Boolean)
        .map((interest) => interest.slice(0, 100))
        .filter(
          (interest, index, array) =>
            array.indexOf(interest) === index
        )
        .slice(0, MAX_INTERESTS);
    }

    if (interests.length === 0) {
      return NextResponse.json(
        { error: "Choose at least one interest." },
        { status: 400 }
      );
    }

    if (
      featuredInterest &&
      !interests.includes(featuredInterest)
    ) {
      return NextResponse.json(
        {
          error:
            "Your featured interest must be one of your selected interests.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    /*
     * Only update notification preferences when they are explicitly
     * included in the request.
     *
     * This prevents saving the profile from accidentally resetting
     * notification settings configured elsewhere.
     */
    const updateFields: Record<string, unknown> = {
      name,
      bio,
      interests,
      featuredInterest,
      visibility,
      messagePermission,
    };

    if (typeof body.friendRequestNotifications === "boolean") {
      updateFields.friendRequestNotifications =
        body.friendRequestNotifications;
    }

    if (typeof body.messageNotifications === "boolean") {
      updateFields.messageNotifications =
        body.messageNotifications;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateFields,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        "name username email bio interests featuredInterest visibility messagePermission friendRequestNotifications messageNotifications createdAt updatedAt"
      )
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully.",
      profile: {
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
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      { error: "Unable to save your profile." },
      { status: 500 }
    );
  }
}
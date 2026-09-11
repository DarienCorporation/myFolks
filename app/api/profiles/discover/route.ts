import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import DiscoveryInteraction from "@/models/DiscoveryInteraction";

const CANDIDATE_COUNT = 12;

type PublicProfile = {
  id: string;
  name: string;
  username: string;
  featuredInterest: string;
  bio: string;
  initials: string;
  allowsMessages: boolean;
};

type DiscoveryUser = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  bio?: string;
  featuredInterest?: string;
  messagePermission?: "friends" | "anyone" | "nobody";
};

function createInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return (
    words[0].slice(0, 1) +
    words[words.length - 1].slice(0, 1)
  ).toUpperCase();
}

function toPublicProfile(
  user: DiscoveryUser
): PublicProfile {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    featuredInterest: user.featuredInterest ?? "",
    bio: user.bio ?? "",
    initials: createInitials(user.name),
    allowsMessages:
      user.messagePermission === "anyone",
  };
}

function createComparisonKey(
  firstProfileId: string,
  secondProfileId: string
) {
  return [firstProfileId, secondProfileId]
    .sort()
    .join(":");
}

async function getEncounteredProfileIds(
  viewerId: string
) {
  const interactions =
    await DiscoveryInteraction.find({
      viewerId: new Types.ObjectId(viewerId),
    })
      .select(
        "anchorProfileId challengerProfileId"
      )
      .lean();

  const encounteredIds = new Set<string>();

  for (const interaction of interactions) {
    encounteredIds.add(
      interaction.anchorProfileId.toString()
    );

    encounteredIds.add(
      interaction.challengerProfileId.toString()
    );
  }

  return encounteredIds;
}

async function getRandomCandidates(
  viewerId: string,
  excludedIds: Set<string>,
  count: number
) {
  const excludedObjectIds = Array.from(excludedIds)
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  excludedObjectIds.push(
    new Types.ObjectId(viewerId)
  );

  const users = await User.aggregate<DiscoveryUser>([
    {
      $match: {
        _id: {
          $nin: excludedObjectIds,
        },

        visibility: "public",

        featuredInterest: {
          $exists: true,
          $type: "string",
          $ne: "",
        },
      },
    },

    {
      $sample: {
        size: count,
      },
    },

    {
      $project: {
        name: 1,
        username: 1,
        bio: 1,
        featuredInterest: 1,
        messagePermission: 1,
      },
    },
  ]);

  return users.map(toPublicProfile);
}

async function getPublicProfile(
  profileId: string
) {
  if (!Types.ObjectId.isValid(profileId)) {
    return null;
  }

  const user =
    await User.findOne({
      _id: new Types.ObjectId(profileId),

      visibility: "public",

      featuredInterest: {
        $exists: true,
        $type: "string",
        $ne: "",
      },
    })
      .select(
        "name username bio featuredInterest messagePermission"
      )
      .lean<DiscoveryUser | null>();

  if (!user) {
    return null;
  }

  return toPublicProfile(user);
}

/*
 * GET
 *
 * Starts a new discovery session:
 *
 * A vs B
 */
export async function GET() {
  try {
    const viewerId = await getSessionUserId();

    console.log(
      "[discover] session user ID:",
      viewerId
    );

    if (!viewerId) {
      console.log(
        "[discover] NO SESSION"
      );

      return NextResponse.json(
        {
          error:
            "You must be signed in to discover people.",
        },
        {
          status: 401,
        }
      );
    }

    const validObjectId =
      Types.ObjectId.isValid(viewerId);

    console.log(
      "[discover] valid ObjectId:",
      validObjectId
    );

    if (!validObjectId) {
      console.log(
        "[discover] INVALID OBJECT ID:",
        viewerId
      );

      return NextResponse.json(
        {
          error: "Invalid session.",
        },
        {
          status: 401,
        }
      );
    }

    await connectToDatabase();

    console.log(
      "[discover] authentication passed:",
      viewerId
    );

    const encounteredIds =
      await getEncounteredProfileIds(
        viewerId
      );

    const candidates =
      await getRandomCandidates(
        viewerId,
        encounteredIds,
        2
      );

    console.log(
      "[discover] candidates found:",
      candidates.length
    );

    if (candidates.length < 2) {
      return NextResponse.json({
        success: true,
        anchor: null,
        challenger: null,
        exhausted: true,
        message:
          "There are not enough new people available to start discovery.",
      });
    }

    return NextResponse.json({
      success: true,
      anchor: candidates[0],
      challenger: candidates[1],
      exhausted: false,
    });
  } catch (error) {
    console.error(
      "Discover profiles error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load people to discover.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST
 *
 * Records:
 *
 * A vs B
 *
 * Then determines:
 *
 * choose A -> A vs C
 *
 * choose B -> B vs C
 *
 * skip     -> A vs C
 */
export async function POST(request: Request) {
  try {
    const viewerId = await getSessionUserId();

    console.log(
      "[discover POST] session user ID:",
      viewerId
    );

    if (!viewerId) {
      console.log(
        "[discover POST] NO SESSION"
      );

      return NextResponse.json(
        {
          error:
            "You must be signed in.",
        },
        {
          status: 401,
        }
      );
    }

    const validObjectId =
      Types.ObjectId.isValid(viewerId);

    console.log(
      "[discover POST] valid ObjectId:",
      validObjectId
    );

    if (!validObjectId) {
      console.log(
        "[discover POST] INVALID OBJECT ID:",
        viewerId
      );

      return NextResponse.json(
        {
          error: "Invalid session.",
        },
        {
          status: 401,
        }
      );
    }

    let body: {
      anchorProfileId?: unknown;
      challengerProfileId?: unknown;
      selectedProfileId?: unknown;
      action?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const anchorProfileId =
      typeof body.anchorProfileId === "string"
        ? body.anchorProfileId.trim()
        : "";

    const challengerProfileId =
      typeof body.challengerProfileId === "string"
        ? body.challengerProfileId.trim()
        : "";

    const selectedProfileId =
      typeof body.selectedProfileId === "string"
        ? body.selectedProfileId.trim()
        : null;

    const action =
      body.action === "selected"
        ? "selected"
        : body.action === "skipped"
          ? "skipped"
          : null;

    if (
      !Types.ObjectId.isValid(
        anchorProfileId
      ) ||
      !Types.ObjectId.isValid(
        challengerProfileId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid discovery profiles.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      anchorProfileId ===
        challengerProfileId ||
      anchorProfileId === viewerId ||
      challengerProfileId === viewerId
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid discovery comparison.",
        },
        {
          status: 400,
        }
      );
    }

    if (!action) {
      return NextResponse.json(
        {
          error:
            "Invalid discovery action.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      action === "selected" &&
      (!selectedProfileId ||
        !Types.ObjectId.isValid(
          selectedProfileId
        ) ||
        ![
          anchorProfileId,
          challengerProfileId,
        ].includes(selectedProfileId))
    ) {
      return NextResponse.json(
        {
          error:
            "The selected person must belong to this comparison.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      action === "skipped" &&
      selectedProfileId !== null
    ) {
      return NextResponse.json(
        {
          error:
            "A skipped comparison cannot contain a selected person.",
        },
        {
          status: 400,
        }
      );
    }

    await connectToDatabase();

    const profiles =
      await User.find({
        _id: {
          $in: [
            new Types.ObjectId(
              anchorProfileId
            ),
            new Types.ObjectId(
              challengerProfileId
            ),
          ],
        },

        visibility: "public",

        featuredInterest: {
          $exists: true,
          $type: "string",
          $ne: "",
        },
      })
        .select("_id")
        .lean();

    if (profiles.length !== 2) {
      return NextResponse.json(
        {
          error:
            "One or more people are no longer available.",
        },
        {
          status: 409,
        }
      );
    }

    const comparisonKey =
      createComparisonKey(
        anchorProfileId,
        challengerProfileId
      );

    try {
      await DiscoveryInteraction.create({
        viewerId: new Types.ObjectId(
          viewerId
        ),

        anchorProfileId:
          new Types.ObjectId(
            anchorProfileId
          ),

        challengerProfileId:
          new Types.ObjectId(
            challengerProfileId
          ),

        comparisonKey,

        selectedProfileId:
          action === "selected" &&
          selectedProfileId
            ? new Types.ObjectId(
                selectedProfileId
              )
            : null,

        action,
      });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code ===
          11000
      ) {
        return NextResponse.json({
          success: true,
          alreadyRecorded: true,
        });
      }

      throw error;
    }

    const nextAnchorId =
      action === "selected" &&
      selectedProfileId
        ? selectedProfileId
        : anchorProfileId;

    const nextAnchor =
      await getPublicProfile(
        nextAnchorId
      );

    if (!nextAnchor) {
      return NextResponse.json(
        {
          error:
            "The selected person is no longer available.",
        },
        {
          status: 409,
        }
      );
    }

    const encounteredIds =
      await getEncounteredProfileIds(
        viewerId
      );

    encounteredIds.delete(
      nextAnchorId
    );

    const candidates =
      await getRandomCandidates(
        viewerId,
        encounteredIds,
        CANDIDATE_COUNT
      );

    let nextChallenger: PublicProfile | null =
      null;

    for (const candidate of candidates) {
      if (candidate.id === nextAnchorId) {
        continue;
      }

      const candidateKey =
        createComparisonKey(
          nextAnchor.id,
          candidate.id
        );

      const alreadyCompared =
        await DiscoveryInteraction.exists({
          viewerId:
            new Types.ObjectId(viewerId),

          comparisonKey:
            candidateKey,
        });

      if (!alreadyCompared) {
        nextChallenger = candidate;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      anchor: nextAnchor,
      challenger: nextChallenger,
      exhausted: !nextChallenger,
    });
  } catch (error) {
    console.error(
      "Discover interaction error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save your discovery choice.",
      },
      {
        status: 500,
      }
    );
  }
}
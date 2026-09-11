import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config({
  path: ".env.local",
});

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

const DEMO_PASSWORD = "Demo12345!";

const demoUsers = [
  {
    name: "Maya Anderson",
    username: "maya_demo",
    email: "maya.demo@myfolks.local",
    bio: "Photographer who loves discovering new places and finding beauty in everyday moments.",
    interests: ["Photography", "Travel", "Art", "Music"],
    featuredInterest: "Photography",
  },
  {
    name: "Ethan Carter",
    username: "ethan_demo",
    email: "ethan.demo@myfolks.local",
    bio: "Software developer, gamer, and curious mind who enjoys building things.",
    interests: ["Programming", "Gaming", "Music", "Science"],
    featuredInterest: "Programming",
  },
  {
    name: "Sofia Bennett",
    username: "sofia_demo",
    email: "sofia.demo@myfolks.local",
    bio: "Astronomy enthusiast fascinated by the universe, science, and the stories we discover through reading.",
    interests: ["Astronomy", "Science", "Reading", "Photography"],
    featuredInterest: "Astronomy",
  },
  {
    name: "Noah Williams",
    username: "noah_demo",
    email: "noah.demo@myfolks.local",
    bio: "Music lover who enjoys cooking, traveling, and staying active.",
    interests: ["Music", "Cooking", "Travel", "Fitness"],
    featuredInterest: "Music",
  },
  {
    name: "Olivia Martin",
    username: "olivia_demo",
    email: "olivia.demo@myfolks.local",
    bio: "Artist and language enthusiast who loves books, culture, and exploring new places.",
    interests: ["Art", "Languages", "Reading", "Travel"],
    featuredInterest: "Art",
  },
  {
    name: "Liam Thompson",
    username: "liam_demo",
    email: "liam.demo@myfolks.local",
    bio: "Developer and gamer with a fascination for astronomy and staying active.",
    interests: ["Programming", "Astronomy", "Gaming", "Fitness"],
    featuredInterest: "Gaming",
  },
  {
    name: "Ava Mitchell",
    username: "ava_demo",
    email: "ava.demo@myfolks.local",
    bio: "Creative person who enjoys photography, languages, cooking, and visual arts.",
    interests: ["Photography", "Languages", "Cooking", "Art"],
    featuredInterest: "Photography",
  },
  {
    name: "Daniel Brooks",
    username: "daniel_demo",
    email: "daniel.demo@myfolks.local",
    bio: "Science enthusiast who enjoys programming, reading, and learning about the universe.",
    interests: ["Science", "Programming", "Reading", "Astronomy"],
    featuredInterest: "Science",
  },
];

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 240,
      trim: true,
    },

    interests: {
      type: [String],
      default: [],
    },

    featuredInterest: {
      type: String,
      default: "",
      trim: true,
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    messagePermission: {
      type: String,
      enum: ["friends", "anyone", "nobody"],
      default: "friends",
    },

    friendRequestNotifications: {
      type: Boolean,
      default: true,
    },

    messageNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);

async function seedDemoUsers() {
  console.log("Connecting to MongoDB...");

  await mongoose.connect(MONGODB_URI);

  console.log("Connected.");
  console.log("");

  const passwordHash = await bcrypt.hash(
    DEMO_PASSWORD,
    12
  );

  for (const demoUser of demoUsers) {
    const user = await User.findOneAndUpdate(
      {
        username: demoUser.username,
      },
      {
        $set: {
          name: demoUser.name,
          email: demoUser.email,
          passwordHash,
          bio: demoUser.bio,
          interests: demoUser.interests,
          featuredInterest:
            demoUser.featuredInterest,
          visibility: "public",
          messagePermission: "anyone",
          friendRequestNotifications: true,
          messageNotifications: true,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `✓ ${user.name} (@${user.username})`
    );
  }

  console.log("");
  console.log(
    `Created/updated ${demoUsers.length} demo users.`
  );
}

seedDemoUsers()
  .catch((error) => {
    console.error("");
    console.error(
      "Failed to seed demo users."
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
import mongoose, { Schema } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

const demoUsernames = [
  "maya_demo",
  "ethan_demo",
  "sofia_demo",
  "noah_demo",
  "olivia_demo",
  "liam_demo",
  "ava_demo",
  "daniel_demo",
];

const UserSchema = new Schema(
  {
    username: String,
  },
  {
    collection: "users",
  }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);

async function removeDemoUsers() {
  console.log("Connecting to MongoDB...");

  await mongoose.connect(MONGODB_URI);

  console.log("Connected.");
  console.log("");

  const result = await User.deleteMany({
    username: {
      $in: demoUsernames,
    },
  });

  console.log(
    `Removed ${result.deletedCount} demo users.`
  );
}

removeDemoUsers()
  .catch((error) => {
    console.error("");
    console.error("Failed to remove demo users.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
import mongoose, { Model, Schema } from "mongoose";

export type MessagePermission = "friends" | "anyone" | "nobody";
export type ProfileVisibility = "public" | "private";

export interface IUser {
  name: string;
  username: string;
  email: string;
  passwordHash: string;

  bio: string;

  interests: string[];
  featuredInterest: string;

  visibility: ProfileVisibility;
  messagePermission: MessagePermission;

  friendRequestNotifications: boolean;
  messageNotifications: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
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
      match: /^[a-z0-9_]+$/,
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
      select: false,
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
      validate: {
        validator: (value: string[]) => value.length <= 8,
        message: "A user can have at most 8 interests.",
      },
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

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
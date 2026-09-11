import mongoose, { Model, Schema, Types } from "mongoose";

export type DiscoveryAction = "selected" | "skipped";

export interface IDiscoveryInteraction {
  viewerId: Types.ObjectId;
  anchorProfileId: Types.ObjectId;
  challengerProfileId: Types.ObjectId;
  comparisonKey: string;
  selectedProfileId: Types.ObjectId | null;
  action: DiscoveryAction;
  createdAt: Date;
  updatedAt: Date;
}

const DiscoveryInteractionSchema =
  new Schema<IDiscoveryInteraction>(
    {
      viewerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      anchorProfileId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      challengerProfileId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      /*
       * The IDs are sorted before being stored.
       *
       * A:B and B:A therefore become the same comparison.
       */
      comparisonKey: {
        type: String,
        required: true,
      },

      selectedProfileId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      action: {
        type: String,
        enum: ["selected", "skipped"],
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * A user should never have the same two people presented
 * as a comparison twice.
 */
DiscoveryInteractionSchema.index(
  {
    viewerId: 1,
    comparisonKey: 1,
  },
  {
    unique: true,
  }
);

DiscoveryInteractionSchema.index({
  viewerId: 1,
  createdAt: -1,
});

const DiscoveryInteraction: Model<IDiscoveryInteraction> =
  mongoose.models.DiscoveryInteraction ||
  mongoose.model<IDiscoveryInteraction>(
    "DiscoveryInteraction",
    DiscoveryInteractionSchema
  );

export default DiscoveryInteraction;
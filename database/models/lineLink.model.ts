import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface ILineLink extends Document {
    userId: string;
    lineUserId: string | null;
    linkCode: string | null;
    linkCodeExpiresAt: Date | null;
    linkedAt: Date | null;
}

const LineLinkSchema = new Schema<ILineLink>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        lineUserId: { type: String, default: null },
        linkCode: { type: String, default: null },
        linkCodeExpiresAt: { type: Date, default: null },
        linkedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const LineLink: Model<ILineLink> =
    (models?.LineLink as Model<ILineLink>) || model<ILineLink>('LineLink', LineLinkSchema);

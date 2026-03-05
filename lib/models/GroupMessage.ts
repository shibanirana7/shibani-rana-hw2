import mongoose, { Schema, Document } from 'mongoose'

export interface IGroupMessage extends Document {
  groupId: mongoose.Types.ObjectId
  participantId: mongoose.Types.ObjectId | null
  participantName: string
  type: 'system' | 'message' | 'rsvp'
  message: string
  rsvpStatus?: 'yes' | 'no' | 'maybe'
  createdAt: Date
}

const GroupMessageSchema = new Schema<IGroupMessage>({
  groupId: { type: Schema.Types.ObjectId, ref: 'HappyHourGroup', required: true },
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', default: null },
  participantName: { type: String, required: true },
  type: { type: String, enum: ['system', 'message', 'rsvp'], default: 'message' },
  message: { type: String, required: true },
  rsvpStatus: { type: String, enum: ['yes', 'no', 'maybe'] },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.GroupMessage ||
  mongoose.model<IGroupMessage>('GroupMessage', GroupMessageSchema)

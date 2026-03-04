import mongoose, { Schema, Document } from 'mongoose'

export interface IHappyHourGroup extends Document {
  participantIds: mongoose.Types.ObjectId[]
  participantNames: string[]
  suggestedTimes: Array<{ day: string; time: string }>
  vibeProfile: {
    venueTypes: string[]
    drinkTypes: string[]
    budgetRange: string
    groupSize: number
  }
  averageCompatibilityScore: number
  createdAt: Date
}

const HappyHourGroupSchema = new Schema<IHappyHourGroup>({
  participantIds: [{ type: Schema.Types.ObjectId, ref: 'Participant' }],
  participantNames: [String],
  suggestedTimes: [{ day: String, time: String }],
  vibeProfile: {
    venueTypes: [String],
    drinkTypes: [String],
    budgetRange: String,
    groupSize: Number,
  },
  averageCompatibilityScore: Number,
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.HappyHourGroup ||
  mongoose.model<IHappyHourGroup>('HappyHourGroup', HappyHourGroupSchema)

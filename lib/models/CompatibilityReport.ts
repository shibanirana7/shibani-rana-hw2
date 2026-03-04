import mongoose, { Schema, Document } from 'mongoose'

export interface ICompatibilityReport extends Document {
  fromParticipantId: mongoose.Types.ObjectId
  fromParticipantName: string
  toParticipantId: mongoose.Types.ObjectId
  toParticipantName: string
  scores: {
    scheduleOverlap: number
    vibeCompatibility: number
    drinkCompatibility: number
    budgetCompatibility: number
    groupSizeCompatibility: number
  }
  overallScore: number
  suggestedTimes: Array<{ day: string; time: string }>
  notes: string
  createdAt: Date
}

const CompatibilityReportSchema = new Schema<ICompatibilityReport>({
  fromParticipantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
  },
  fromParticipantName: { type: String, required: true },
  toParticipantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
  },
  toParticipantName: { type: String, required: true },
  scores: {
    scheduleOverlap: { type: Number, min: 0, max: 10 },
    vibeCompatibility: { type: Number, min: 0, max: 10 },
    drinkCompatibility: { type: Number, min: 0, max: 10 },
    budgetCompatibility: { type: Number, min: 0, max: 10 },
    groupSizeCompatibility: { type: Number, min: 0, max: 10 },
  },
  overallScore: { type: Number, min: 0, max: 10 },
  suggestedTimes: [{ day: String, time: String }],
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.CompatibilityReport ||
  mongoose.model<ICompatibilityReport>(
    'CompatibilityReport',
    CompatibilityReportSchema
  )

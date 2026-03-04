import mongoose, { Schema, Document } from 'mongoose'

export interface IVenue {
  name: string
  address: string
  url?: string
  notes?: string
  submittedBy: string
}

export interface IHappyHourGroup extends Document {
  city: string
  participantIds: mongoose.Types.ObjectId[]
  participantNames: string[]
  memberOrder: mongoose.Types.ObjectId[]   // order joined; index 0 = leader
  leaderParticipantId: mongoose.Types.ObjectId
  selectedTime: { day: string; time: string } | null
  minimumGroupSize: number
  status: 'forming' | 'ready_for_venue_search' | 'venue_found'
  venueSearchIndex: number
  venue: IVenue | null
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
  city: { type: String, required: true },
  participantIds: [{ type: Schema.Types.ObjectId, ref: 'Participant' }],
  participantNames: [String],
  memberOrder: [{ type: Schema.Types.ObjectId, ref: 'Participant' }],
  leaderParticipantId: { type: Schema.Types.ObjectId, ref: 'Participant' },
  selectedTime: { day: String, time: String },
  minimumGroupSize: { type: Number, default: 2 },
  status: {
    type: String,
    enum: ['forming', 'ready_for_venue_search', 'venue_found'],
    default: 'forming',
  },
  venueSearchIndex: { type: Number, default: 0 },
  venue: {
    name: String,
    address: String,
    url: String,
    notes: String,
    submittedBy: String,
  },
  vibeProfile: {
    venueTypes: [String],
    drinkTypes: [String],
    budgetRange: String,
    groupSize: Number,
  },
  averageCompatibilityScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.HappyHourGroup ||
  mongoose.model<IHappyHourGroup>('HappyHourGroup', HappyHourGroupSchema)

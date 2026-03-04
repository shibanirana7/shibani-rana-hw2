import mongoose, { Schema, Document } from 'mongoose'

export interface IAvailabilitySlot {
  day: string
  startTime: string
  endTime: string
}

export interface IVibePreferences {
  venueTypes: string[]
  drinkTypes: string[]
  budgetRange: string
  groupSizePreference: 'intimate' | 'medium' | 'large'
}

export interface IParticipant extends Document {
  name: string
  email: string
  city: string
  preferredContact: 'email' | 'discord' | 'slack' | 'sms'
  contactHandle: string
  availability: IAvailabilitySlot[]
  vibePreferences: IVibePreferences
  agentToken: string
  createdAt: Date
}

const ParticipantSchema = new Schema<IParticipant>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  city: { type: String, required: true, default: '' },
  preferredContact: {
    type: String,
    enum: ['email', 'discord', 'slack', 'sms'],
    default: 'email',
  },
  contactHandle: { type: String, default: '' },
  availability: [
    {
      day: String,
      startTime: String,
      endTime: String,
    },
  ],
  vibePreferences: {
    venueTypes: [String],
    drinkTypes: [String],
    budgetRange: { type: String, default: '$$' },
    groupSizePreference: {
      type: String,
      enum: ['intimate', 'medium', 'large'],
      default: 'medium',
    },
  },
  agentToken: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Participant ||
  mongoose.model<IParticipant>('Participant', ParticipantSchema)

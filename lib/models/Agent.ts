import mongoose, { Schema, Document } from 'mongoose'

export interface IAgent extends Document {
  participantId: mongoose.Types.ObjectId
  token: string
  status: 'idle' | 'conversing' | 'done'
  conversationsCompleted: number
  lastSeen: Date
  createdAt: Date
}

const AgentSchema = new Schema<IAgent>({
  participantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
  },
  token: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['idle', 'conversing', 'done'],
    default: 'idle',
  },
  conversationsCompleted: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Agent ||
  mongoose.model<IAgent>('Agent', AgentSchema)

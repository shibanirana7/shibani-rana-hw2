import mongoose, { Schema, Document } from 'mongoose'

export interface IConversation extends Document {
  participantIds: mongoose.Types.ObjectId[]
  agentIds: mongoose.Types.ObjectId[]
  participantNames: string[]
  status: 'active' | 'completed' | 'abandoned'
  startedAt: Date
  completedAt?: Date
}

const ConversationSchema = new Schema<IConversation>({
  participantIds: [{ type: Schema.Types.ObjectId, ref: 'Participant' }],
  agentIds: [{ type: Schema.Types.ObjectId, ref: 'Agent' }],
  participantNames: [String],
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
})

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema)

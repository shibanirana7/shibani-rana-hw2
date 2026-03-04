import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId
  fromAgentId: mongoose.Types.ObjectId
  fromParticipantName: string
  content: string
  timestamp: Date
}

const MessageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  fromAgentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  fromParticipantName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
})

export default mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema)

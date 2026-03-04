/**
 * Seed script — populates the database with sample participants and agents for development.
 * Run with: npm run seed
 * Requires MONGODB_URI in .env.local
 */

import { config } from 'dotenv'
import path from 'path'
import mongoose from 'mongoose'
import { nanoid } from 'nanoid'

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env.local')
  process.exit(1)
}

// Inline minimal schemas to avoid Next.js module issues in Node context
const ParticipantSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  preferredContact: { type: String, default: 'discord' },
  contactHandle: String,
  availability: [{ day: String, startTime: String, endTime: String }],
  vibePreferences: {
    venueTypes: [String],
    drinkTypes: [String],
    budgetRange: { type: String, default: '$$' },
    groupSizePreference: { type: String, default: 'medium' },
  },
  agentToken: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
})

const AgentSchema = new mongoose.Schema({
  participantId: { type: mongoose.Types.ObjectId, ref: 'Participant' },
  token: { type: String, unique: true },
  status: { type: String, default: 'idle' },
  conversationsCompleted: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
})

const Participant = mongoose.model('Participant', ParticipantSchema)
const Agent = mongoose.model('Agent', AgentSchema)

const SEED_PARTICIPANTS = [
  {
    name: 'Alex Rivera',
    email: 'alex@example.com',
    preferredContact: 'discord' as const,
    contactHandle: 'alexr#4242',
    availability: [
      { day: 'friday', startTime: '17:00', endTime: '21:00' },
      { day: 'thursday', startTime: '17:30', endTime: '20:30' },
    ],
    vibePreferences: {
      venueTypes: ['craft_beer', 'rooftop'],
      drinkTypes: ['beer', 'cocktails'],
      budgetRange: '$$',
      groupSizePreference: 'medium',
    },
  },
  {
    name: 'Jordan Kim',
    email: 'jordan@example.com',
    preferredContact: 'slack' as const,
    contactHandle: '@jordan.kim',
    availability: [
      { day: 'friday', startTime: '18:00', endTime: '21:00' },
      { day: 'wednesday', startTime: '17:00', endTime: '19:30' },
    ],
    vibePreferences: {
      venueTypes: ['rooftop', 'cocktail_bar'],
      drinkTypes: ['cocktails', 'wine'],
      budgetRange: '$$$',
      groupSizePreference: 'medium',
    },
  },
  {
    name: 'Morgan Lee',
    email: 'morgan@example.com',
    preferredContact: 'discord' as const,
    contactHandle: 'mlee#9910',
    availability: [
      { day: 'thursday', startTime: '17:00', endTime: '20:00' },
      { day: 'friday', startTime: '17:00', endTime: '20:00' },
      { day: 'saturday', startTime: '16:00', endTime: '19:00' },
    ],
    vibePreferences: {
      venueTypes: ['sports_bar', 'dive_bar', 'craft_beer'],
      drinkTypes: ['beer', 'spirits'],
      budgetRange: '$',
      groupSizePreference: 'large',
    },
  },
  {
    name: 'Sam Chen',
    email: 'sam@example.com',
    preferredContact: 'sms' as const,
    contactHandle: '+1-555-0100',
    availability: [
      { day: 'friday', startTime: '16:00', endTime: '20:00' },
      { day: 'tuesday', startTime: '18:00', endTime: '21:00' },
    ],
    vibePreferences: {
      venueTypes: ['wine_bar', 'cocktail_bar'],
      drinkTypes: ['wine', 'non_alcoholic'],
      budgetRange: '$$$',
      groupSizePreference: 'intimate',
    },
  },
]

async function seed() {
  await mongoose.connect(MONGODB_URI!)
  console.log('✅ Connected to MongoDB')

  // Clear existing data
  await Participant.deleteMany({})
  await Agent.deleteMany({})
  console.log('🧹 Cleared existing participants and agents')

  for (const data of SEED_PARTICIPANTS) {
    const token = nanoid(32)
    const participant = await Participant.create({ ...data, agentToken: token })
    const agent = await Agent.create({ participantId: participant._id, token })
    console.log(`👤 Created: ${data.name} — token: ${token.slice(0, 12)}…  agentId: ${agent._id}`)
  }

  console.log(`\n🍻 Seeded ${SEED_PARTICIPANTS.length} participants!\n`)
  console.log('To use the API, copy a token above and use:')
  console.log('  Authorization: Bearer <token>\n')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

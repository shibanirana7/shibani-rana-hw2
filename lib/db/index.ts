import mongoose from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | null
}

if (!global._mongooseConn) {
  global._mongooseConn = null
  global._mongoosePromise = null
}

export default async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  if (global._mongooseConn) return global._mongooseConn

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  global._mongooseConn = await global._mongoosePromise
  return global._mongooseConn
}

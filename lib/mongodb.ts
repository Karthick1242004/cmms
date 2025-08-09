import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

// Strongly type a global cache to avoid creating multiple connections in dev
type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose_cache__: MongooseCache | undefined
}

const globalWithCache = global as typeof globalThis & { __mongoose_cache__?: MongooseCache }

let cached: MongooseCache = globalWithCache.__mongoose_cache__ ?? { conn: null, promise: null }
globalWithCache.__mongoose_cache__ = cached

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false } as const
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}

export default connectDB
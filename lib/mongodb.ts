import mongoose from 'mongoose'
import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

// Strongly type a global cache to avoid creating multiple connections in dev
type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

type MongoClientCache = {
  client: MongoClient | null
  db: Db | null
  promise: Promise<MongoClient> | null
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose_cache__: MongooseCache | undefined
  // eslint-disable-next-line no-var
  var __mongo_client_cache__: MongoClientCache | undefined
}

const globalWithCache = global as typeof globalThis & { 
  __mongoose_cache__?: MongooseCache
  __mongo_client_cache__?: MongoClientCache
}

let cached: MongooseCache = globalWithCache.__mongoose_cache__ ?? { conn: null, promise: null }
globalWithCache.__mongoose_cache__ = cached

let clientCached: MongoClientCache = globalWithCache.__mongo_client_cache__ ?? { 
  client: null, 
  db: null, 
  promise: null 
}
globalWithCache.__mongo_client_cache__ = clientCached

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

// MongoDB Native Driver Connection (for direct queries)
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (clientCached.client && clientCached.db) {
    return { client: clientCached.client, db: clientCached.db }
  }

  if (!clientCached.promise) {
    clientCached.promise = MongoClient.connect(MONGODB_URI)
  }

  try {
    clientCached.client = await clientCached.promise
    clientCached.db = clientCached.client.db('cmms') // Use the 'cmms' database
  } catch (error) {
    clientCached.promise = null
    throw error
  }

  return { client: clientCached.client, db: clientCached.db }
}

export default connectDB
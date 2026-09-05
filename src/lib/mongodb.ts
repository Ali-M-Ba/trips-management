import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memory: MongoMemoryServer | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
  memory: null,
};

if (!globalForMongoose.mongooseCache) {
  globalForMongoose.mongooseCache = cache;
}

async function resolveUri() {
  const configured = process.env.MONGODB_URI;
  const useEmbedded = process.env.MONGODB_EMBEDDED !== "false";

  if (!useEmbedded && configured) return configured;

  if (configured && configured !== "mongodb://127.0.0.1:27017/trips-management") {
    return configured;
  }

  if (cache.memory) return cache.memory.getUri();

  const dbPath = path.resolve(/*turbopackIgnore: true*/
    process.cwd(),
    process.env.MONGODB_DATA_DIR ?? [".data", "mongo"].join(path.sep),
  );
  fs.mkdirSync(dbPath, { recursive: true });

  cache.memory = await MongoMemoryServer.create({
    instance: {
      dbName: "trips-management",
      dbPath,
      storageEngine: "wiredTiger",
    },
  });

  return cache.memory.getUri();
}

export async function connectDb() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = resolveUri().then((uri) =>
      mongoose.connect(uri, { bufferCommands: false }),
    );
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

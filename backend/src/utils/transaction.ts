import mongoose, { ClientSession } from 'mongoose';

/**
 * Runs `fn` inside a MongoDB transaction (requires a replica set).
 * The driver automatically retries `fn` on transient errors such as write
 * conflicts, so `fn` must re-read whatever state it depends on each time.
 */
export async function withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => fn(session));
  } finally {
    await session.endSession();
  }
}

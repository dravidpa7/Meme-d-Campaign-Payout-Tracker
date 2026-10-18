import { ClientSession } from 'mongoose';

/** Optional Mongo session so repository calls can join a transaction. */
export type WithSession = { session?: ClientSession };

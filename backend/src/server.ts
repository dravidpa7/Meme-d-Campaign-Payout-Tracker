import { Server } from 'node:http';
import { app } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';
import { closeRedis, initRedis } from './config/redis';

let server: Server | undefined;

async function start(): Promise<void> {
  await connectDatabase();
  initRedis();

  server = app.listen(env.PORT, () => logger.info(`API listening on port ${env.PORT}`));
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down`);
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  try {
    if (server) await new Promise<void>((resolve, reject) => server!.close((e) => (e ? reject(e) : resolve())));
    await Promise.all([disconnectDatabase(), closeRedis()]);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});

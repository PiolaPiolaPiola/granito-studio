import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

/** Arranca un MongoDB real en memoria (se descarga la primera vez) y lo comparte con las pruebas. */
export default async function ({ provide }: TestProject) {
  const servidor = await MongoMemoryServer.create();
  provide('mongoUri', servidor.getUri());

  return async () => {
    await servidor.stop();
  };
}

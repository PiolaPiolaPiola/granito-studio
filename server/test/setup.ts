import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';

// Las variables se fijan antes de que cualquier prueba importe app.ts (env.ts las valida al cargar).
const id = randomUUID();
const dirUploads = path.join(os.tmpdir(), `granito-test-${id}`);
const uri = new URL(inject('mongoUri'));
uri.pathname = `/granito_test_${id.slice(0, 8)}`;

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = uri.toString();
process.env.JWT_SECRET = 'secreto-de-pruebas-con-al-menos-32-caracteres';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.UPLOADS_DIR = dirUploads;

const { default: mongoose } = await import('mongoose');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? '');
  await mongoose.connection.syncIndexes();
});

afterEach(async () => {
  const colecciones = Object.values(mongoose.connection.collections);
  await Promise.all(colecciones.map((coleccion) => coleccion.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await rm(dirUploads, { recursive: true, force: true });
});

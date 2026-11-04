import mongoose from 'mongoose';
import { env } from './env.js';

export async function conectarBaseDatos(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.info(`MongoDB conectado · base ${mongoose.connection.name}`);
}

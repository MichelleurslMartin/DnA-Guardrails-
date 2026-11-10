import { closeDatabase, openDatabase } from './database.js';

const database = await openDatabase();
try {
  console.log('Database schema is up to date.');
} finally {
  await closeDatabase(database);
}
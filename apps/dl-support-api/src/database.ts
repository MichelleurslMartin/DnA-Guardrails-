import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const migrationDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations');
const migrations = [
  { version: '001_initial_schema', file: '001_initial_schema.sql' },
  { version: '002_work_item_source_links', file: '002_work_item_source_links.sql' },
  { version: '003_hvlv_reconciliation_comments', file: '003_hvlv_reconciliation_comments.sql' },
  { version: '004_portfolio_projects', file: '004_portfolio_projects.sql' },
  { version: '005_portfolio_project_engagements', file: '005_portfolio_project_engagements.sql' },
  { version: '006_project_scoped_hvlv_comments', file: '006_project_scoped_hvlv_comments.sql' },
] as const;

export type Database = PGlite;

export async function openDatabase(options: { memory?: boolean } = {}): Promise<Database> {
  const defaultDataDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../.database');
  const dataDirectory = process.env.WORKBENCH_DATABASE_DIR ?? defaultDataDirectory;
  const database = options.memory ? new PGlite() : new PGlite(dataDirectory);
  await applyMigrations(database);
  return database;
}

export async function applyMigrations(database: Database): Promise<void> {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  for (const migration of migrations) {
    const { rows } = await database.query<{ version: string }>(
      'SELECT version FROM schema_migrations WHERE version = $1',
      [migration.version],
    );
    if (rows.length > 0) continue;

    const sql = await readFile(resolve(migrationDirectory, migration.file), 'utf8');
    await database.exec('BEGIN');
    try {
      await database.exec(sql);
      await database.query('INSERT INTO schema_migrations (version) VALUES ($1)', [migration.version]);
      await database.exec('COMMIT');
    } catch (error) {
      await database.exec('ROLLBACK');
      throw error;
    }
  }
}

export async function closeDatabase(database: Database): Promise<void> {
  await database.close();
}
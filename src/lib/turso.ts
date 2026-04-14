import { createClient, type Client } from '@libsql/client';

type DatabaseMode = 'turso' | 'local' | 'none';

type DatabaseConfig =
  | { mode: 'turso'; url: string; authToken: string }
  | { mode: 'local'; url: string }
  | { mode: 'none' };

function getDatabaseConfig(): DatabaseConfig {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoAuthToken) {
    return {
      mode: 'turso',
      url: tursoUrl,
      authToken: tursoAuthToken,
    };
  }

  const localUrl = process.env.DATABASE_URL;
  if (localUrl && localUrl.startsWith('file:')) {
    return {
      mode: 'local',
      url: localUrl,
    };
  }

  return { mode: 'none' };
}

const databaseConfig = getDatabaseConfig();

export const turso: Client | null =
  databaseConfig.mode === 'none'
    ? null
    : createClient(
        databaseConfig.mode === 'turso'
          ? {
              url: databaseConfig.url,
              authToken: databaseConfig.authToken,
            }
          : {
              url: databaseConfig.url,
            }
      );

export function getDatabaseMode(): DatabaseMode {
  return databaseConfig.mode;
}

export function isDatabaseAvailable(): boolean {
  return turso !== null;
}

export async function initializeDatabase() {
  if (!turso) {
    console.log('Database not configured; persistence disabled');
    return;
  }

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      project TEXT,
      linkedProjects TEXT DEFAULT '[]',
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      due TEXT,
      durationHours INTEGER DEFAULT 0,
      durationMinutes INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      progress INTEGER DEFAULT 0,
      notes TEXT,
      subtasks TEXT DEFAULT '[]',
      isArchived INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await turso.execute(`ALTER TABLE tasks ADD COLUMN linkedProjects TEXT DEFAULT '[]'`);
  } catch {
    // Column already exists on upgraded databases.
  }

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT 'blue',
      icon TEXT DEFAULT 'folder',
      tasks INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      due TEXT,
      "order" INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0,
      category TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS project_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      projectId TEXT,
      blocks TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      wordCount INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log(`Database initialized in ${databaseConfig.mode} mode`);
}

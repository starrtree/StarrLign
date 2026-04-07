import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    if (process.env[key]) continue;

    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('\"') && value.endsWith('\"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadLocalEnv();

const localUrl = process.env.DATABASE_URL;
const remoteUrl = process.env.TURSO_DATABASE_URL;
const remoteAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!localUrl || !localUrl.startsWith('file:')) {
  console.error('DATABASE_URL must point to your local file database, for example file:./dev.db');
  process.exit(1);
}

if (!remoteUrl || !remoteAuthToken) {
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before migrating to cloud.');
  process.exit(1);
}

const localClient = createClient({ url: localUrl });
const remoteClient = createClient({
  url: remoteUrl,
  authToken: remoteAuthToken,
});

function parseJson(value, fallback) {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function initializeRemoteDatabase() {
  await remoteClient.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      project TEXT,
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

  await remoteClient.execute(`
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

  await remoteClient.execute(`
    CREATE TABLE IF NOT EXISTS project_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await remoteClient.execute(`
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

  await remoteClient.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function readSnapshot() {
  const tasksResult = await localClient.execute('SELECT * FROM tasks ORDER BY createdAt DESC');
  const projectsResult = await localClient.execute('SELECT * FROM projects ORDER BY "order" ASC');
  const categoriesResult = await localClient.execute('SELECT * FROM project_categories ORDER BY "order" ASC');
  const documentsResult = await localClient.execute('SELECT * FROM documents ORDER BY updatedAt DESC');
  const tagsResult = await localClient.execute("SELECT value FROM app_state WHERE key = 'tags'");

  return {
    tasks: tasksResult.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      project: row.project ? String(row.project) : '',
      priority: row.priority ? String(row.priority) : 'medium',
      status: row.status ? String(row.status) : 'todo',
      due: row.due ? String(row.due) : '',
      durationHours: Number(row.durationHours ?? 0),
      durationMinutes: Number(row.durationMinutes ?? 0),
      tags: parseJson(row.tags, []),
      progress: Number(row.progress ?? 0),
      notes: row.notes ? String(row.notes) : '',
      subtasks: parseJson(row.subtasks, []),
      isArchived: Boolean(row.isArchived),
    })),
    projects: projectsResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      color: row.color ? String(row.color) : 'blue',
      icon: row.icon ? String(row.icon) : 'folder',
      tasks: Number(row.tasks ?? 0),
      completed: Number(row.completed ?? 0),
      due: row.due ? String(row.due) : '',
      order: Number(row.order ?? 0),
      isArchived: Boolean(row.isArchived),
      category: row.category ? String(row.category) : null,
    })),
    projectCategories: categoriesResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      order: Number(row.order ?? 0),
    })),
    documents: documentsResult.rows.map((row) => ({
      id: String(row.id),
      title: row.title ? String(row.title) : '',
      projectId: row.projectId ? String(row.projectId) : null,
      blocks: parseJson(row.blocks, []),
      createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
      updatedAt: row.updatedAt ? String(row.updatedAt) : new Date().toISOString(),
      wordCount: Number(row.wordCount ?? 0),
      isArchived: Boolean(row.isArchived),
    })),
    tags: tagsResult.rows[0] ? parseJson(tagsResult.rows[0].value, []) : [],
  };
}

async function writeSnapshot(snapshot) {
  const batchStatements = [
    { sql: 'DELETE FROM tasks', args: [] },
    { sql: 'DELETE FROM projects', args: [] },
    { sql: 'DELETE FROM project_categories', args: [] },
    { sql: 'DELETE FROM documents', args: [] },
  ];

  for (const task of snapshot.tasks) {
    batchStatements.push({
      sql: 'INSERT INTO tasks (id, title, project, priority, status, due, durationHours, durationMinutes, tags, progress, notes, subtasks, isArchived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        task.id,
        task.title,
        task.project || null,
        task.priority,
        task.status,
        task.due || null,
        task.durationHours || 0,
        task.durationMinutes || 0,
        JSON.stringify(task.tags || []),
        task.progress || 0,
        task.notes || null,
        JSON.stringify(task.subtasks || []),
        task.isArchived ? 1 : 0,
      ],
    });
  }

  for (const project of snapshot.projects) {
    batchStatements.push({
      sql: 'INSERT INTO projects (id, name, color, icon, tasks, completed, due, "order", isArchived, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        project.id,
        project.name,
        project.color || 'blue',
        project.icon || 'folder',
        project.tasks || 0,
        project.completed || 0,
        project.due || null,
        project.order || 0,
        project.isArchived ? 1 : 0,
        project.category || null,
      ],
    });
  }

  for (const category of snapshot.projectCategories) {
    batchStatements.push({
      sql: 'INSERT INTO project_categories (id, name, "order") VALUES (?, ?, ?)',
      args: [category.id, category.name, category.order || 0],
    });
  }

  for (const document of snapshot.documents) {
    batchStatements.push({
      sql: 'INSERT INTO documents (id, title, projectId, blocks, createdAt, updatedAt, wordCount, isArchived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        document.id,
        document.title || '',
        document.projectId || null,
        JSON.stringify(document.blocks || []),
        document.createdAt || new Date().toISOString(),
        document.updatedAt || new Date().toISOString(),
        document.wordCount || 0,
        document.isArchived ? 1 : 0,
      ],
    });
  }

  batchStatements.push({
    sql: "INSERT OR REPLACE INTO app_state (key, value) VALUES ('tags', ?)",
    args: [JSON.stringify(snapshot.tags || [])],
  });

  await remoteClient.batch(batchStatements);
}

async function main() {
  await initializeRemoteDatabase();
  const snapshot = await readSnapshot();
  await writeSnapshot(snapshot);

  console.log('Migrated local StarrLign data to Turso cloud.');
  console.log(`Tasks: ${snapshot.tasks.length}`);
  console.log(`Projects: ${snapshot.projects.length}`);
  console.log(`Project categories: ${snapshot.projectCategories.length}`);
  console.log(`Documents: ${snapshot.documents.length}`);
  console.log(`Tags: ${snapshot.tags.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

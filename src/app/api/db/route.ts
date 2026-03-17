import { NextRequest, NextResponse } from 'next/server';
import { turso, initializeDatabase, isDatabaseAvailable, getDatabaseMode } from '@/lib/turso';
import { Task, Project, ProjectCategory, Document } from '@/lib/types';

let dbInitialized = false;

async function ensureDbInit() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  if (!isDatabaseAvailable() || !turso) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database not configured',
        databaseMode: getDatabaseMode(),
      },
      { status: 503 }
    );
  }

  try {
    await ensureDbInit();

    const tasksResult = await turso.execute('SELECT * FROM tasks ORDER BY createdAt DESC');
    const tasks: Task[] = tasksResult.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      project: row.project ? String(row.project) : '',
      priority: ((row.priority as Task['priority']) || 'medium'),
      status: ((row.status as Task['status']) || 'todo'),
      due: row.due ? String(row.due) : '',
      durationHours: Number(row.durationHours ?? 0),
      durationMinutes: Number(row.durationMinutes ?? 0),
      tags: parseJsonField<string[]>(row.tags, []),
      progress: Number(row.progress ?? 0),
      notes: row.notes ? String(row.notes) : '',
      subtasks: parseJsonField<Task['subtasks']>(row.subtasks, []),
      isArchived: Boolean(row.isArchived),
    }));

    const projectsResult = await turso.execute('SELECT * FROM projects ORDER BY "order" ASC');
    const projects: Project[] = projectsResult.rows.map((row) => ({
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
    }));

    const categoriesResult = await turso.execute('SELECT * FROM project_categories ORDER BY "order" ASC');
    const projectCategories: ProjectCategory[] = categoriesResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      order: Number(row.order ?? 0),
    }));

    const documentsResult = await turso.execute('SELECT * FROM documents ORDER BY updatedAt DESC');
    const documents: Document[] = documentsResult.rows.map((row) => ({
      id: String(row.id),
      title: row.title ? String(row.title) : '',
      projectId: row.projectId ? String(row.projectId) : null,
      blocks: parseJsonField<Document['blocks']>(row.blocks, []),
      createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
      updatedAt: row.updatedAt ? String(row.updatedAt) : new Date().toISOString(),
      wordCount: Number(row.wordCount ?? 0),
      isArchived: Boolean(row.isArchived),
    }));

    const tagsResult = await turso.execute("SELECT value FROM app_state WHERE key = 'tags'");
    const tags = tagsResult.rows[0] ? parseJsonField<string[]>(tagsResult.rows[0].value, []) : [];

    return NextResponse.json({
      success: true,
      databaseMode: getDatabaseMode(),
      data: { tasks, projects, projectCategories, documents, tags },
    });
  } catch (error) {
    console.error('Error loading data:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isDatabaseAvailable() || !turso) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database not configured',
        databaseMode: getDatabaseMode(),
      },
      { status: 503 }
    );
  }

  try {
    await ensureDbInit();

    const body = await request.json();
    const { tasks, projects, projectCategories, documents, tags } = body;

    const batchStatements: { sql: string; args: (string | number | null)[] }[] = [];

    batchStatements.push({ sql: 'DELETE FROM tasks', args: [] });
    for (const task of (tasks || []) as Task[]) {
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

    batchStatements.push({ sql: 'DELETE FROM projects', args: [] });
    for (const project of (projects || []) as Project[]) {
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

    batchStatements.push({ sql: 'DELETE FROM project_categories', args: [] });
    for (const category of (projectCategories || []) as ProjectCategory[]) {
      batchStatements.push({
        sql: 'INSERT INTO project_categories (id, name, "order") VALUES (?, ?, ?)',
        args: [category.id, category.name, category.order || 0],
      });
    }

    batchStatements.push({ sql: 'DELETE FROM documents', args: [] });
    for (const doc of (documents || []) as Document[]) {
      batchStatements.push({
        sql: 'INSERT INTO documents (id, title, projectId, blocks, createdAt, updatedAt, wordCount, isArchived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          doc.id,
          doc.title || '',
          doc.projectId || null,
          JSON.stringify(doc.blocks || []),
          doc.createdAt || new Date().toISOString(),
          doc.updatedAt || new Date().toISOString(),
          doc.wordCount || 0,
          doc.isArchived ? 1 : 0,
        ],
      });
    }

    batchStatements.push({
      sql: "INSERT OR REPLACE INTO app_state (key, value) VALUES ('tags', ?)",
      args: [JSON.stringify(tags || [])],
    });

    await turso.batch(batchStatements);

    return NextResponse.json({ success: true, databaseMode: getDatabaseMode() });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

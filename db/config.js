import { defineDb, defineTable, column, NOW } from 'astro:db';

const Project = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    description: column.text({ optional: true }),
    directory: column.text({ unique: true }),
    created_at: column.date({ default: NOW }),
  },
});

const Issue = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    project_id: column.text({ references: () => Project.columns.id }),
    title: column.text(),
    description: column.text(),
    type: column.text({ default: 'Bug' }), // Bug, Tweak, Enhancement
    priority: column.text({ optional: false }),
    status: column.text({ default: 'todo' }),
    attachments: column.json({ optional: true }),
    scheduled_for: column.date({ optional: true }),
    created_at: column.date({ default: NOW }),
    updated_at: column.date({ default: NOW }),
  },
});

const Report = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    issue_id: column.text({ references: () => Issue.columns.id }),
    summary: column.text({ optional: true }),
    files_changed: column.json({ optional: true }),
    details: column.text({ optional: true }),
    created_at: column.date({ default: NOW }),
  },
});

const Log = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    issue_id: column.text({ references: () => Issue.columns.id }),
    action: column.text(),
    summary: column.text({ optional: true }),
    created_at: column.date({ default: NOW }),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: {
    Project,
    Issue,
    Report,
    Log,
  },
});

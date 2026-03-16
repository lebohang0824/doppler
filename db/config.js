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
    priority: column.text({ optional: false }),
    status: column.text({ default: 'todo' }),
    scheduled_for: column.date({ optional: true }),
    created_at: column.date({ default: NOW }),
    updated_at: column.date({ default: NOW }),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: { Project, Issue },
});

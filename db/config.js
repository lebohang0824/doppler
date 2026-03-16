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

// https://astro.build/db/config
export default defineDb({
  tables: { Project },
});

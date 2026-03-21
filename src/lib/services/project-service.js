import { db, Project, Issue, eq, desc } from 'astro:db';

export class ProjectService {
  static async getAll() {
    return await db.select().from(Project).orderBy(desc(Project.created_at));
  }

  static async getById(id) {
    return await db.select().from(Project).where(eq(Project.id, id)).get();
  }

  static async getByDirectory(directory) {
    return await db.select().from(Project).where(eq(Project.directory, directory)).get();
  }

  static async create(name, description, directory) {
    const id = crypto.randomUUID();
    await db.insert(Project).values({
      id,
      name,
      description,
      directory,
      created_at: new Date(),
    });
    return await this.getById(id);
  }

  static async update(id, data) {
    await db.update(Project).set(data).where(eq(Project.id, id));
    return await this.getById(id);
  }

  static async delete(id) {
    // Delete associated issues, logs, reports (cascading manually)
    const issues = await db.select({ id: Issue.id }).from(Issue).where(eq(Issue.project_id, id));
    const { IssueService } = await import('./issue-service.js');
    for (const issue of issues) {
      await IssueService.delete(issue.id);
    }
    return await db.delete(Project).where(eq(Project.id, id));
  }
}

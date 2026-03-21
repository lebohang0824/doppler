import { db, Issue, Log, eq, and, desc, count } from 'astro:db';

export class IssueService {
  static async getAll(projectId = null) {
    let query = db.select().from(Issue);
    if (projectId) {
      query = query.where(eq(Issue.project_id, projectId));
    }
    return await query.orderBy(desc(Issue.created_at));
  }

  static async getById(id) {
    return await db.select().from(Issue).where(eq(Issue.id, id)).get();
  }

  static async create(data) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(Issue).values({
      id,
      ...data,
      created_at: now,
      updated_at: now,
    });
    return await this.getById(id);
  }

  static async update(id, data) {
    const now = new Date();
    await db.update(Issue)
      .set({ ...data, updated_at: now })
      .where(eq(Issue.id, id));
    return await this.getById(id);
  }

  static async delete(id) {
    // Delete associated logs and reports first
    await db.delete(Log).where(eq(Log.issue_id, id));
    const { Report } = await import('astro:db');
    await db.delete(Report).where(eq(Report.issue_id, id));
    return await db.delete(Issue).where(eq(Issue.id, id));
  }

  static async updateStatus(id, status, extraData = {}) {
    return await this.update(id, { status, ...extraData });
  }

  static async getCountsByProject(projectId) {
    const results = await db
      .select({ status: Issue.status, count: count() })
      .from(Issue)
      .where(eq(Issue.project_id, projectId))
      .groupBy(Issue.status);

    const counts = {
      todo: 0,
      queued: 0,
      executing: 0,
      testing: 0,
      done: 0,
    };

    results.forEach((row) => {
      const status = row.status.toLowerCase();
      if (counts.hasOwnProperty(status)) {
        counts[status] = row.count;
      }
    });

    return counts;
  }
}

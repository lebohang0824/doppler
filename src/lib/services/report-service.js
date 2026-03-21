import { db, Report, eq, desc } from 'astro:db';

export class ReportService {
  static async getByIssue(issueId) {
    return await db.select().from(Report).where(eq(Report.issue_id, issueId)).orderBy(desc(Report.created_at));
  }

  static async create(issueId, data) {
    const id = crypto.randomUUID();
    await db.insert(Report).values({
      id,
      issue_id: issueId,
      ...data,
      created_at: new Date(),
    });
    return await db.select().from(Report).where(eq(Report.id, id)).get();
  }

  static async deleteByIssue(issueId) {
    return await db.delete(Report).where(eq(Report.issue_id, issueId));
  }
}

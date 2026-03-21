import { db, Log, Issue, eq, desc, inArray } from 'astro:db';

export class LogService {
  static async getByIssue(issueId) {
    return await db.select().from(Log).where(eq(Log.issue_id, issueId)).orderBy(desc(Log.created_at));
  }

  static async create(issueId, action, summary) {
    const id = crypto.randomUUID();
    await db.insert(Log).values({
      id,
      issue_id: issueId,
      action,
      summary,
      created_at: new Date(),
    });
    return await db.select().from(Log).where(eq(Log.id, id)).get();
  }

  static async deleteByIssue(issueId) {
    return await db.delete(Log).where(eq(Log.issue_id, issueId));
  }

  static async getByProject(projectId, limit = 50) {
    // Find all issues for this project
    const projectIssues = await db
        .select({ id: Issue.id })
        .from(Issue)
        .where(eq(Issue.project_id, projectId));

    const issueIds = projectIssues.map(issue => issue.id);
    
    if (issueIds.length === 0) {
        return [];
    }

    // Find logs for these issues
    return await db
      .select({
        id: Log.id,
        issue_id: Log.issue_id,
        action: Log.action,
        summary: Log.summary,
        created_at: Log.created_at,
        issue_title: Issue.title 
      })
      .from(Log)
      .innerJoin(Issue, eq(Log.issue_id, Issue.id))
      .where(inArray(Log.issue_id, issueIds))
      .orderBy(desc(Log.created_at))
      .limit(limit);
  }
}

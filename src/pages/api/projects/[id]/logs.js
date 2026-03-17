import { db, Log, Issue, eq, desc, inArray } from 'astro:db';

export const GET = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Find all issues for this project
    const projectIssues = await db
        .select({ id: Issue.id })
        .from(Issue)
        .where(eq(Issue.project_id, id));

    const issueIds = projectIssues.map(issue => issue.id);
    
    if (issueIds.length === 0) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Find logs for these issues
    const logs = await db
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
      .limit(50);

    return new Response(JSON.stringify(logs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

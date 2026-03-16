import { db, Issue, Project, eq } from 'astro:db';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['todo', 'testing', 'done'];

export const GET = async ({ url }) => {
  try {
    const projectId = url.searchParams.get('project_id');
    let issues;
    if (projectId) {
      issues = await db.select().from(Issue).where(eq(Issue.project_id, projectId));
    } else {
      issues = await db.select().from(Issue);
    }
    return new Response(JSON.stringify(issues), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch issues' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { project_id, title, description, priority, status, scheduled_for } = body;

    if (!project_id || !title || !description || !priority) {
      return new Response(
        JSON.stringify({ error: 'project_id, title, description, and priority are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return new Response(
        JSON.stringify({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Check if project exists
    const project = await db
      .select()
      .from(Project)
      .where(eq(Project.id, project_id))
      .get();

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = crypto.randomUUID();
    const newIssueData = {
      id,
      project_id,
      title,
      description,
      priority,
      status: status || 'todo',
      scheduled_for: scheduled_for ? new Date(scheduled_for) : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.insert(Issue).values(newIssueData);

    const newIssue = await db
      .select()
      .from(Issue)
      .where(eq(Issue.id, id))
      .get();

    return new Response(JSON.stringify(newIssue), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to create issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

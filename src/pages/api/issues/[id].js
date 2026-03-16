import { db, Issue, eq } from 'astro:db';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['todo', 'testing', 'done'];

export const GET = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const issue = await db
      .select()
      .from(Issue)
      .where(eq(Issue.id, id))
      .get();

    if (!issue) {
      return new Response(JSON.stringify({ error: 'Issue not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(issue), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { title, description, priority, status, scheduled_for } = body;

    const existingIssue = await db
      .select()
      .from(Issue)
      .where(eq(Issue.id, id))
      .get();
    if (!existingIssue) {
      return new Response(JSON.stringify({ error: 'Issue not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    
    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return new Response(
          JSON.stringify({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      updateData.priority = priority;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return new Response(
          JSON.stringify({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      updateData.status = status;
    }

    if (scheduled_for !== undefined) {
      updateData.scheduled_for = scheduled_for ? new Date(scheduled_for) : null;
    }

    updateData.updated_at = new Date();

    if (Object.keys(updateData).length > 0) {
      await db.update(Issue).set(updateData).where(eq(Issue.id, id));
    }

    const updatedIssue = await db
      .select()
      .from(Issue)
      .where(eq(Issue.id, id))
      .get();

    return new Response(JSON.stringify(updatedIssue), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to update issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await db.delete(Issue).where(eq(Issue.id, id));

    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

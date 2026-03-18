import { db, Issue, Log, Report, eq } from 'astro:db';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['todo', 'queued', 'executing', 'testing', 'done'];
const VALID_TYPES = ['Bug', 'Tweak', 'Enhancement'];

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
    const { title, description, priority, status, type, scheduled_for } = body;

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
    const changes = [];

    if (title !== undefined && title !== existingIssue.title) {
        updateData.title = title;
        changes.push(`Title changed from "${existingIssue.title}" to "${title}"`);
    }
    if (description !== undefined && description !== existingIssue.description) {
        updateData.description = description;
        changes.push('Description updated');
    }
    
    if (priority !== undefined && priority !== existingIssue.priority) {
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
      changes.push(`Priority changed to ${priority}`);
    }

    if (status !== undefined && status !== existingIssue.status) {
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
      changes.push(`Status changed to ${status}`);
    }

    if (type !== undefined && type !== existingIssue.type) {
      if (!VALID_TYPES.includes(type)) {
        return new Response(
          JSON.stringify({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      updateData.type = type;
      changes.push(`Type changed to ${type}`);
    }

    if (scheduled_for !== undefined) {
      const newScheduledDate = scheduled_for ? new Date(scheduled_for) : null;
      if (newScheduledDate?.getTime() !== existingIssue.scheduled_for?.getTime()) {
          updateData.scheduled_for = newScheduledDate;
          changes.push(`Scheduled for ${newScheduledDate ? newScheduledDate.toLocaleDateString() : 'unscheduled'}`);
      }
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await db.update(Issue).set(updateData).where(eq(Issue.id, id));

      // LOG THE CHANGES
      await db.insert(Log).values({
        id: crypto.randomUUID(),
        issue_id: id,
        action: 'Updated',
        summary: changes.join(', '),
        created_at: new Date(),
      });
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
    // Delete associated records first due to foreign key constraints
    await db.delete(Log).where(eq(Log.issue_id, id));
    await db.delete(Report).where(eq(Report.issue_id, id));
    
    // Now delete the issue itself
    const result = await db.delete(Issue).where(eq(Issue.id, id));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

import { IssueService } from '../../../lib/services/issue-service.js';
import { LogService } from '../../../lib/services/log-service.js';

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
    const issue = await IssueService.getById(id);

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

    const existingIssue = await IssueService.getById(id);
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

    let updatedIssue = existingIssue;
    if (Object.keys(updateData).length > 0) {
      updatedIssue = await IssueService.update(id, updateData);

      // LOG THE CHANGES
      await LogService.create(id, 'Updated', changes.join(', '));
    }

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
    await IssueService.delete(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

import { IssueService } from '../../../../lib/services/issue-service.js';
import { ProjectService } from '../../../../lib/services/project-service.js';
import { LogService } from '../../../../lib/services/log-service.js';
import { resetToHead } from '../../../../lib/git-service.js';

export const POST = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { reason } = await request.json();
    if (!reason) {
      return new Response(
        JSON.stringify({ error: 'Rejection reason is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const issue = await IssueService.getById(id);
    if (!issue) {
      return new Response(JSON.stringify({ error: 'Issue not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const project = await ProjectService.getById(issue.project_id);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reset the changes
    try {
      await resetToHead(project.directory);
    } catch (gitError) {
      console.error('Git reset failed:', gitError);
      // We continue anyway, as we want to update the issue status
    }

    // Update status to todo
    await IssueService.updateStatus(id, 'todo');

    // Log the rejection
    await LogService.create(id, 'Rejected', `Issue rejected: ${reason}`);

    return new Response(JSON.stringify({ success: true, status: 'todo' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

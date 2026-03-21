import { IssueService } from '../../../../lib/services/issue-service.js';
import { ProjectService } from '../../../../lib/services/project-service.js';
import { LogService } from '../../../../lib/services/log-service.js';
import { commit } from '../../../../lib/git-service.js';

export const POST = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message } = await request.json();
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Approval message is required' }),
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

    // Commit the changes
    try {
      await commit(project.directory, `Issue #${id.slice(0, 8)}: ${message}`);
    } catch (gitError) {
      console.error('Git commit failed:', gitError);
      return new Response(
        JSON.stringify({
          error:
            'Failed to commit changes. Ensure there are changes to commit and git is initialized.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Update status to done
    await IssueService.updateStatus(id, 'done');

    // Log the approval
    await LogService.create(id, 'Approved', `Issue approved and committed: ${message}`);

    return new Response(JSON.stringify({ success: true, status: 'done' }), {
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

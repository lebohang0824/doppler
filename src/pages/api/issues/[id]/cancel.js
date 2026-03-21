import { IssueService } from '../../../../lib/services/issue-service.js';
import { LogService } from '../../../../lib/services/log-service.js';
import { cancelGeminiRequest } from '../../../../lib/gemini-service.js';
import { cancelOpencodeRequest } from '../../../../lib/opencode-service.js';

export const POST = async ({ params }) => {
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

    if (issue.status !== 'executing') {
      return new Response(JSON.stringify({ error: 'No execution in progress' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const provider = issue.provider || 'opencode';

    let cancelled = false;
    if (provider === 'opencode') {
      cancelled = cancelOpencodeRequest();
    } else {
      cancelled = cancelGeminiRequest();
    }

    if (cancelled) {
      await IssueService.updateStatus(id, 'todo');
      await LogService.create(id, 'Execution Cancelled', `${provider === 'opencode' ? 'Opencode' : 'Gemini'} execution cancelled by user`);

      return new Response(JSON.stringify({ success: true, status: 'todo' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'No process to cancel' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Failed to cancel execution' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

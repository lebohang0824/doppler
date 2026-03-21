import { IssueService } from '../../../../lib/services/issue-service.js';

export const GET = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const counts = await IssueService.getCountsByProject(id);

    return new Response(JSON.stringify(counts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    return new Response(JSON.stringify({ error: 'Failed to fetch counts' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

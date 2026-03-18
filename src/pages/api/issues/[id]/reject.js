import { db, Issue, Project, Log, eq } from 'astro:db';
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

    const issue = await db.select().from(Issue).where(eq(Issue.id, id)).get();
    if (!issue) {
      return new Response(JSON.stringify({ error: 'Issue not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const project = await db
      .select()
      .from(Project)
      .where(eq(Project.id, issue.project_id))
      .get();
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
    await db
      .update(Issue)
      .set({ status: 'todo', updated_at: new Date() })
      .where(eq(Issue.id, id));

    // Log the rejection
    await db.insert(Log).values({
      id: crypto.randomUUID(),
      issue_id: id,
      action: 'Rejected',
      summary: `Issue rejected: ${reason}`,
      created_at: new Date(),
    });

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

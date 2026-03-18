import { db, Issue, Project, Log, eq } from 'astro:db';
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
    await db
      .update(Issue)
      .set({ status: 'done', updated_at: new Date() })
      .where(eq(Issue.id, id));

    // Log the approval
    await db.insert(Log).values({
      id: crypto.randomUUID(),
      issue_id: id,
      action: 'Approved',
      summary: `Issue approved and committed: ${message}`,
      created_at: new Date(),
    });

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

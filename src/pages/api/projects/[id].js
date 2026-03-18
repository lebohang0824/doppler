import { db, Project, Issue, Log, Report, eq, inArray } from 'astro:db';
import { initializeWithFirstCommit } from '../../../lib/git-service.js';

export const GET = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const project = await db
      .select()
      .from(Project)
      .where(eq(Project.id, id))
      .get();

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      await initializeWithFirstCommit(project.directory);
    } catch (e) {
      console.error(`Failed to initialize git in ${project.directory}:`, e);
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH = async ({ params, request }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, description, directory } = body;

    const existingProject = await db
      .select()
      .from(Project)
      .where(eq(Project.id, id))
      .get();
    if (!existingProject) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (directory !== undefined) updateData.directory = directory;

    if (Object.keys(updateData).length > 0) {
      await db.update(Project).set(updateData).where(eq(Project.id, id));

      if (directory !== undefined) {
        try {
          await initializeWithFirstCommit(directory);
        } catch (e) {
          console.error(`Failed to initialize git in ${directory}:`, e);
        }
      }
    }

    const updatedProject = await db
      .select()
      .from(Project)
      .where(eq(Project.id, id))
      .get();

    return new Response(JSON.stringify(updatedProject), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get all issues for this project to delete their related logs and reports
    const projectIssues = await db
      .select({ id: Issue.id })
      .from(Issue)
      .where(eq(Issue.project_id, id));

    const issueIds = projectIssues.map((issue) => issue.id);

    if (issueIds.length > 0) {
      // Delete Logs related to these issues
      await db.delete(Log).where(inArray(Log.issue_id, issueIds));

      // Delete Reports related to these issues
      await db.delete(Report).where(inArray(Report.issue_id, issueIds));

      // Delete the Issues
      await db.delete(Issue).where(eq(Issue.project_id, id));
    }

    // Finally delete the project
    await db.delete(Project).where(eq(Project.id, id));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

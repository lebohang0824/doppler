import { ProjectService } from '../../../lib/services/project-service.js';
import { initializeWithFirstCommit } from '../../../lib/git-service.js';

export const GET = async () => {
  try {
    const projects = await ProjectService.getAll();
    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, description, directory } = body;

    if (!name || !directory) {
      return new Response(
        JSON.stringify({ error: 'Name and directory are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const newProject = await ProjectService.create(name, description, directory);

    try {
      await initializeWithFirstCommit(directory);
    } catch (e) {
      console.error(`Failed to initialize git in ${directory}:`, e);
      // We still return 201 because the project was created in the database
    }

    return new Response(JSON.stringify(newProject), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to create project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

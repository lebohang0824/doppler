import { db, Project, eq } from 'astro:db';

export const GET = async () => {
  try {
    const projects = await db.select().from(Project);
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

    const id = crypto.randomUUID();
    await db.insert(Project).values({
      id,
      name,
      description,
      directory,
      created_at: new Date(),
    });

    const newProject = await db
      .select()
      .from(Project)
      .where(eq(Project.id, id))
      .get();

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

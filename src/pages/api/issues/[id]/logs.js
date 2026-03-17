import { db, Log, eq, desc } from 'astro:db';

export const GET = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const logs = await db
      .select()
      .from(Log)
      .where(eq(Log.issue_id, id))
      .orderBy(desc(Log.created_at))
      .limit(50);

    return new Response(JSON.stringify(logs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching logs for issue:", error);
    return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

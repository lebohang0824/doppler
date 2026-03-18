import { db, Issue, eq, count } from 'astro:db';

export const GET = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const results = await db
      .select({ status: Issue.status, count: count() })
      .from(Issue)
      .where(eq(Issue.project_id, id))
      .groupBy(Issue.status);

    const counts = {
      todo: 0,
      queued: 0,
      executing: 0,
      testing: 0,
      done: 0,
    };

    results.forEach((row) => {
      const status = row.status.toLowerCase();
      if (counts.hasOwnProperty(status)) {
        counts[status] = row.count;
      }
    });

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

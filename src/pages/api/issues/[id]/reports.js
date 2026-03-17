import { db, Report, eq, desc } from 'astro:db';

export const GET = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const reports = await db
      .select()
      .from(Report)
      .where(eq(Report.issue_id, id))
      .orderBy(desc(Report.created_at));

    return new Response(JSON.stringify(reports), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error fetching reports for issue:", error);
    return new Response(JSON.stringify({ error: 'Failed to fetch reports' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

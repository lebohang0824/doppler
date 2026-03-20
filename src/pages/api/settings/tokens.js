import { db, ApiToken, eq } from 'astro:db';

export const GET = async () => {
  try {
    const tokens = await db.select().from(ApiToken);
    const result = tokens.reduce((acc, token) => {
      acc[token.provider] = {
        hasToken: !!token.token,
        updated_at: token.updated_at,
      };
      return acc;
    }, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to fetch tokens' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST = async ({ request }) => {
  try {
    const { provider, token } = await request.json();

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Provider is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await db.select().from(ApiToken).where(eq(ApiToken.provider, provider)).get();

    if (existing) {
      await db.update(ApiToken)
        .set({ token, updated_at: new Date() })
        .where(eq(ApiToken.provider, provider));
    } else {
      await db.insert(ApiToken).values({
        id: crypto.randomUUID(),
        provider,
        token,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to save token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE = async ({ request }) => {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Provider is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(ApiToken).where(eq(ApiToken.provider, provider));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to delete token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

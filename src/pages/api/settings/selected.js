import { db, SelectedModel, Model, eq } from 'astro:db';

export const GET = async () => {
  try {
    const selected = await db.select().from(SelectedModel).where(eq(SelectedModel.id, 'default')).get();

    if (!selected) {
      const defaultModel = await db.select().from(Model).where(eq(Model.id, 'gemini-3.1-pro-preview')).get();
      
      return new Response(JSON.stringify({
        provider: 'gemini',
        model_id: 'gemini-3.1-pro-preview',
        model: defaultModel || {
          id: 'gemini-3.1-pro-preview',
          name: 'Gemini 3.1 Pro',
          provider: 'gemini',
          tier: 'free',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = await db.select().from(Model).where(eq(Model.id, selected.model_id)).get();

    return new Response(JSON.stringify({
      ...selected,
      model: model || null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching selected model:', error);
    return new Response(JSON.stringify({
      provider: 'gemini',
      model_id: 'gemini-3.1-pro-preview',
      model: {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro',
        provider: 'gemini',
        tier: 'free',
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST = async ({ request }) => {
  try {
    const { provider, model_id } = await request.json();

    if (!provider || !model_id) {
      return new Response(JSON.stringify({ error: 'Provider and model_id are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await db.select().from(SelectedModel).where(eq(SelectedModel.id, 'default')).get();

    if (existing) {
      await db.update(SelectedModel)
        .set({ provider, model_id, updated_at: new Date() })
        .where(eq(SelectedModel.id, 'default'));
    } else {
      await db.insert(SelectedModel).values({
        id: 'default',
        provider,
        model_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    let model = null;
    try {
      model = await db.select().from(Model).where(eq(Model.id, model_id)).get();
    } catch (e) {
      model = { id: model_id, name: model_id, provider, tier: 'free' };
    }

    return new Response(JSON.stringify({
      provider,
      model_id,
      model,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to save selected model' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

import { SettingsService } from '../../../lib/services/settings-service.js';

export const GET = async () => {
  try {
    const selected = await SettingsService.getSelectedModel();
    const model = await SettingsService.getModelById(selected.model_id);

    return new Response(JSON.stringify({
      ...selected,
      model: model || {
        id: selected.model_id,
        name: selected.model_id,
        provider: selected.provider,
        tier: 'free',
      },
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

    const selected = await SettingsService.saveSelectedModel(provider, model_id);
    const model = await SettingsService.getModelById(model_id);

    return new Response(JSON.stringify({
      ...selected,
      model: model || { id: model_id, name: model_id, provider, tier: 'free' },
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

import { SettingsService } from '../../../lib/services/settings-service.js';

const defaultModels = [];

export const GET = async ({ url }) => {
  try {
    const provider = url.searchParams.get('provider');
    const tier = url.searchParams.get('tier');

    let models = [];
    try {
      const dbModels = await SettingsService.getAllModels();
      if (dbModels.length > 0) {
        models = dbModels;
      } else {
        models = defaultModels;
      }
    } catch (e) {
      console.warn('Could not fetch models from DB, using defaults:', e);
      models = defaultModels;
    }

    if (provider) {
      models = models.filter((m) => m.provider === provider);
    }

    if (tier) {
      models = models.filter((m) => m.tier === tier);
    }

    return new Response(JSON.stringify(models), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify(defaultModels), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

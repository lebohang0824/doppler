import { db, Model, SelectedModel } from 'astro:db';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

const getOpenCodeModels = async () => {
  try {
    const { stdout } = await execPromise('opencode models');
    const lines = stdout.split('\n').filter((line) => line.trim() !== '');

    const models = lines.map((line) => {
      const id = line.trim();
      const modelPart = id.split('/')[1];

      const parts = modelPart.split('-');
      const provider = parts[0];

      const name = parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      return {
        id,
        name,
        provider,
        tier: 'free',
      };
    });

    return models;
  } catch (error) {
    console.error('Failed to execute opencode models:', error.message);
    return [];
  }
};

const geminiModels = [
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'gemini',
    tier: 'free',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'gemini',
    tier: 'free',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'gemini',
    tier: 'free',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    tier: 'free',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    tier: 'free',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Lite',
    provider: 'gemini',
    tier: 'free',
  },
];

const defaultSelectedModel = {
  id: 'default',
  provider: 'gemini',
  model_id: 'gemini-3.1-pro-preview',
};

export default async function seed() {
  const opencodeModels = await getOpenCodeModels();
  const models = [...geminiModels, ...opencodeModels];

  // Seed models
  for (const model of models) {
    await db
      .insert(Model)
      .values({
        ...model,
        enabled: true,
        created_at: new Date(),
      })
      .onConflictDoUpdate({
        target: Model.id,
        set: {
          name: model.name,
          provider: model.provider,
          tier: model.tier,
          updated_at: new Date(),
        },
      });
  }

  // Seed default selected model (overwrite if exists)
  await db
    .insert(SelectedModel)
    .values({
      ...defaultSelectedModel,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: SelectedModel.id,
      set: {
        provider: defaultSelectedModel.provider,
        model_id: defaultSelectedModel.model_id,
        updated_at: new Date(),
      },
    });
}

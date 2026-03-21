import { db, Model, SelectedModel, eq } from 'astro:db';

export class SettingsService {
  // --- Models ---
  static async getAllModels() {
    return await db.select().from(Model);
  }

  static async getModelById(id) {
    return await db.select().from(Model).where(eq(Model.id, id)).get();
  }

  // --- Selected Model ---
  static async getSelectedModel() {
    const selected = await db.select().from(SelectedModel).where(eq(SelectedModel.id, 'default')).get();
    if (!selected) {
      // Return default
      return {
        provider: 'gemini',
        model_id: 'gemini-3.1-pro-preview',
      };
    }
    return selected;
  }

  static async saveSelectedModel(provider, modelId) {
    const existing = await db.select().from(SelectedModel).where(eq(SelectedModel.id, 'default')).get();
    const now = new Date();
    if (existing) {
      await db.update(SelectedModel)
        .set({ provider, model_id: modelId, updated_at: now })
        .where(eq(SelectedModel.id, 'default'));
    } else {
      await db.insert(SelectedModel).values({
        id: 'default',
        provider,
        model_id: modelId,
        created_at: now,
        updated_at: now,
      });
    }
    return await this.getSelectedModel();
  }
}

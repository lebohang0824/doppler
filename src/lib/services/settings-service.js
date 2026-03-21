import { db, ApiToken, Model, SelectedModel, eq } from 'astro:db';

export class SettingsService {
  // --- Tokens ---
  static async getAllTokens() {
    return await db.select().from(ApiToken);
  }

  static async getTokenByProvider(provider) {
    return await db.select().from(ApiToken).where(eq(ApiToken.provider, provider)).get();
  }

  static async saveToken(provider, token) {
    const existing = await this.getTokenByProvider(provider);
    const now = new Date();
    if (existing) {
      await db.update(ApiToken).set({ token, updated_at: now }).where(eq(ApiToken.provider, provider));
    } else {
      await db.insert(ApiToken).values({
        id: crypto.randomUUID(),
        provider,
        token,
        created_at: now,
        updated_at: now,
      });
    }
    return await this.getTokenByProvider(provider);
  }

  static async deleteToken(provider) {
    return await db.delete(ApiToken).where(eq(ApiToken.provider, provider));
  }

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

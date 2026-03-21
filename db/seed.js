import { db, Model, ApiToken, SelectedModel } from 'astro:db';

const models = [
  // Free models
  {
    id: 'opencode/big-pickle',
    name: 'Big Pickle (Default)',
    provider: 'opencode',
    tier: 'free',
  },
  {
    id: 'opencode/minimax-m2.5-free',
    name: 'Minimax 01',
    provider: 'minimax',
    tier: 'free',
  },
  {
    id: 'opencode/mimo-v2-omni-free',
    name: 'Mimo v2 omni',
    provider: 'mimo',
    tier: 'free',
  },
  {
    id: 'opencode/mimo-v2-pro-free',
    name: 'Mimo v2 pro',
    provider: 'mimo',
    tier: 'free',
  },
  {
    id: 'opencode/nemotron-3-super-free',
    name: 'Nemotron v3 Super',
    provider: 'nemotron',
    tier: 'free',
  },
  // Gemini CLI models
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

  // Paid models
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    tier: 'paid',
  },
  {
    id: 'deepseek/deepseek-coder-v2-07242024',
    name: 'DeepSeek Coder V2',
    provider: 'deepseek',
    tier: 'paid',
  },
  {
    id: 'mistral/mistral-small-latest',
    name: 'Mistral Small',
    provider: 'mistral',
    tier: 'paid',
  },
  { id: 'qwen/qwen3-8b', name: 'Qwen3 8B', provider: 'qwen', tier: 'paid' },
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', provider: 'qwen', tier: 'paid' },
  {
    id: 'anthropic/claude-3-5-haiku-latest',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    tier: 'paid',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    tier: 'paid',
  },
  { id: 'openai/o4-mini', name: 'o4 Mini', provider: 'openai', tier: 'paid' },
  {
    id: 'github/copilot',
    name: 'GitHub Copilot',
    provider: 'github',
    tier: 'paid',
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron 70B',
    provider: 'nvidia',
    tier: 'paid',
  },
  {
    id: 'nvidia/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'nvidia',
    tier: 'paid',
  },
  {
    id: 'nebius/llama-4-scout-17b-16b-instruct',
    name: 'Llama 4 Scout',
    provider: 'nebius',
    tier: 'paid',
  },
  {
    id: 'anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    tier: 'paid',
  },
  {
    id: 'anthropic/claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    tier: 'paid',
  },
  {
    id: 'anthropic/claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    tier: 'paid',
  },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'openai', tier: 'paid' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'paid' },
  { id: 'openai/o3', name: 'o3', provider: 'openai', tier: 'paid' },
  {
    id: 'google/gemini-2.5-pro-preview-06-05',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    tier: 'paid',
  },
  {
    id: 'google/gemini-3-pro-preview-05-06',
    name: 'Gemini 3 Pro',
    provider: 'google',
    tier: 'paid',
  },
  {
    id: 'mistral/mistral-large-2407',
    name: 'Mistral Large',
    provider: 'mistral',
    tier: 'paid',
  },
  {
    id: 'cohere/command-a-03-2025',
    name: 'Command A',
    provider: 'cohere',
    tier: 'paid',
  },
  {
    id: 'amazon/nova-pro-1-0',
    name: 'Nova Pro',
    provider: 'amazon',
    tier: 'paid',
  },
  {
    id: 'amazon/nova-lite-1-0',
    name: 'Nova Lite',
    provider: 'amazon',
    tier: 'paid',
  },
];

const defaultSelectedModel = {
  id: 'default',
  provider: 'gemini',
  model_id: 'gemini-3.1-pro-preview',
};

// https://astro.build/db/seed
export default async function seed() {
  // Seed models
  for (const model of models) {
    await db
      .insert(Model)
      .values({
        ...model,
        enabled: 'true',
        created_at: new Date(),
      })
      .onConflictDoUpdate({
        target: Model.id,
        set: {
          name: model.name,
          provider: model.provider,
          tier: model.tier,
        },
      });
  }

  // Seed default selected model
  await db
    .insert(SelectedModel)
    .values({
      ...defaultSelectedModel,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .onConflictDoNothing();
}

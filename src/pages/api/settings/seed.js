import { db, Model } from 'astro:db';

const models = [
  { id: 'opencode/big-pickle', name: 'Big Pickle (Default)', provider: 'opencode', tier: 'free' },
  { id: 'minimax/minimax-01', name: 'Minimax 01', provider: 'minimax', tier: 'free' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', provider: 'deepseek', tier: 'free' },
  { id: 'deepseek/deepseek-coder-v2-07242024', name: 'DeepSeek Coder V2', provider: 'deepseek', tier: 'free' },
  { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', provider: 'google', tier: 'free' },
  { id: 'google/gemini-3-flash-preview-05-06', name: 'Gemini 3 Flash', provider: 'google', tier: 'free' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'google', tier: 'free' },
  { id: 'x-ai/grok-2', name: 'Grok 2', provider: 'x-ai', tier: 'free' },
  { id: 'x-ai/grok-3', name: 'Grok 3', provider: 'x-ai', tier: 'free' },
  { id: 'cohere/command-r7b-12-2024', name: 'Command R7B', provider: 'cohere', tier: 'free' },
  { id: 'mistral/mistral-small-latest', name: 'Mistral Small', provider: 'mistral', tier: 'free' },
  { id: 'qwen/qwen3-8b', name: 'Qwen3 8B', provider: 'qwen', tier: 'free' },
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', provider: 'qwen', tier: 'free' },
  { id: 'anthropic/claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', provider: 'anthropic', tier: 'free' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'free' },
  { id: 'openai/o4-mini', name: 'o4 Mini', provider: 'openai', tier: 'free' },
  { id: 'github/copilot', name: 'GitHub Copilot', provider: 'github', tier: 'free' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', provider: 'nvidia', tier: 'free' },
  { id: 'nvidia/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'nvidia', tier: 'free' },
  { id: 'nebius/llama-4-scout-17b-16b-instruct', name: 'Llama 4 Scout', provider: 'nebius', tier: 'free' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'gemini', tier: 'free' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'gemini', tier: 'free' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'gemini', tier: 'free' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', tier: 'free' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', tier: 'free' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Lite', provider: 'gemini', tier: 'free' },
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', tier: 'paid' },
  { id: 'anthropic/claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', tier: 'paid' },
  { id: 'anthropic/claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'paid' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'openai', tier: 'paid' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'paid' },
  { id: 'openai/o3', name: 'o3', provider: 'openai', tier: 'paid' },
  { id: 'google/gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro', provider: 'google', tier: 'paid' },
  { id: 'google/gemini-3-pro-preview-05-06', name: 'Gemini 3 Pro', provider: 'google', tier: 'paid' },
  { id: 'mistral/mistral-large-2407', name: 'Mistral Large', provider: 'mistral', tier: 'paid' },
  { id: 'cohere/command-a-03-2025', name: 'Command A', provider: 'cohere', tier: 'paid' },
  { id: 'amazon/nova-pro-1-0', name: 'Nova Pro', provider: 'amazon', tier: 'paid' },
  { id: 'amazon/nova-lite-1-0', name: 'Nova Lite', provider: 'amazon', tier: 'paid' },
];

export const POST = async () => {
  try {
    for (const model of models) {
      await db.insert(Model).values({
        ...model,
        enabled: 'true',
        created_at: new Date(),
      }).onConflictDoUpdate({
        target: Model.id,
        set: {
          name: model.name,
          provider: model.provider,
          tier: model.tier,
        },
      });
    }

    return new Response(JSON.stringify({ success: true, count: models.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return new Response(JSON.stringify({ error: 'Failed to seed models' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET = async () => {
  try {
    const allModels = await db.select().from(Model);
    return new Response(JSON.stringify(allModels), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch models' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

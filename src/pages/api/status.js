import { isGeminiRunning } from '../../lib/gemini-service.js';

export const GET = async () => {
  return new Response(JSON.stringify({ running: isGeminiRunning() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

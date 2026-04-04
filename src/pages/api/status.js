import { execSync } from 'node:child_process';

let cachedResult = null;
let cacheTime = 0;
const CACHE_TTL = 10000;

function checkCommand(command) {
  try {
    execSync(command, { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

export const GET = async () => {
  const now = Date.now();

  if (cachedResult && now - cacheTime < CACHE_TTL) {
    return new Response(cachedResult, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // A better way to check the command exists on windows needs to be explored
  const isWindows = process.platform === 'win32';

  const gemini = isWindows ? true : checkCommand('which gemini');
  const opencode = isWindows ? true : checkCommand('which opencode');

  const available = [];
  if (gemini) available.push('gemini');
  if (opencode) available.push('opencode');

  cachedResult = JSON.stringify({
    cli: {
      gemini: { installed: gemini, version: gemini ? 'installed' : null },
      opencode: { installed: opencode, version: opencode ? 'installed' : null },
      available,
      hasAny: available.length > 0,
    },
  });
  cacheTime = now;

  return new Response(cachedResult, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

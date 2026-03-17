import { spawn } from 'node:child_process';

let isRunning = false;
let geminiCommand = 'gemini';
const queue = [];

/**
 * Sets the command to run. Defaults to 'gemini'.
 * @param {string} command - The command to run.
 */
export function setGeminiCommand(command) {
  geminiCommand = command;
}

/**
 * Checks if a Gemini process is currently running.
 * @returns {boolean}
 */
export function isGeminiRunning() {
  return isRunning;
}

/**
 * Queues a Gemini CLI request.
 * @param {string[]} args - The arguments for the gemini command.
 * @param {string} cwd - The working directory to run the command in.
 * @returns {Promise<string>} - Resolves with stdout or rejects with error.
 */
export function runGeminiRequest(args, cwd) {
  return new Promise((resolve, reject) => {
    queue.push({ args, cwd, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isRunning || queue.length === 0) return;

  isRunning = true;
  const { args, cwd, resolve, reject } = queue.shift();

  try {
    const result = await executeGemini(args, cwd);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isRunning = false;
    processQueue();
  }
}

function executeGemini(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(geminiCommand, args, {
      cwd,
      shell: true,
      env: { ...process.env, CI: 'true' } // helping some CLIs detect non-interactive mode
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Gemini process exited with code ${code}\nStderr: ${stderr}\nStdout: ${stdout}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

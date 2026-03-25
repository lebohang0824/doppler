import { spawn } from 'node:child_process';
import {
  isGlobalRunning,
  setGlobalRunning,
  registerProcessor,
} from './execution-lock.js';

let geminiCommand = 'gemini';
const queue = [];
let currentProcess = null;
let currentReject = null;

registerProcessor(processQueue);

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
  return isGlobalRunning();
}

/**
 * Cancels the currently running Gemini process.
 * @returns {boolean} - True if a process was cancelled, false otherwise.
 */
export function cancelGeminiRequest() {
  if (currentProcess && currentProcess.pid) {
    try {
      process.kill(-currentProcess.pid, 'SIGTERM');
    } catch (e) {
      console.warn('Failed to kill process group:', e);
      currentProcess.kill('SIGTERM');
    }

    if (currentReject) {
      currentReject(new Error('Execution cancelled by user'));
    }
    currentProcess = null;
    currentReject = null;
    setGlobalRunning(false);
    return true;
  }
  return false;
}

/**
 * Queues a Gemini CLI request.
 * @param {string[]} args - The arguments for the gemini command.
 * @param {string} cwd - The working directory to run the command in.
 * @param {Object} options - Extra options (onStart).
 * @param {string | null} modelId - The ID of the Gemini model to use (e.g., 'gemini-1.0-pro').
 * @returns {Promise<string>} - Resolves with stdout or rejects with error.
 */
export function runGeminiRequest(args, cwd, options = {}, modelId = null) {
  // Added modelId parameter
  return new Promise((resolve, reject) => {
    queue.push({
      args,
      cwd,
      resolve,
      reject,
      onStart: options.onStart,
      modelId,
    }); // Store modelId
    processQueue();
  });
}

async function processQueue() {
  if (isGlobalRunning() || queue.length === 0) return;

  setGlobalRunning(true);
  const { args, cwd, resolve, reject, onStart, modelId } = queue.shift(); // Destructure modelId

  // Prepend model argument if modelId is provided
  let commandArgs = args;
  if (modelId) {
    // Assuming the Gemini CLI uses a '--model' flag.
    // This might need to be configurable if the flag differs.
    commandArgs = ['--model', modelId, '--yolo', ...args];
  } else {
    commandArgs = ['--yolo', ...args];
  }

  currentReject = reject;

  try {
    // Pass modified commandArgs to executeGemini
    const result = await executeGemini(commandArgs, cwd, onStart);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    currentProcess = null;
    currentReject = null;
    setGlobalRunning(false);
  }
}

function executeGemini(args, cwd, onStart) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';

    currentProcess = spawn(geminiCommand, args, {
      cwd,
      shell: true,
      detached: !isWindows,
      env: { ...process.env, CI: 'true' }, // helping some CLIs detect non-interactive mode
    });

    if (isWindows) {
      currentProcess.unref();
    }

    if (onStart && currentProcess.pid) {
      try {
        onStart(currentProcess.pid);
      } catch (e) {
        console.error('Error in onStart callback:', e);
      }
    }

    let stdout = '';
    let stderr = '';

    if (currentProcess.stdout) {
      currentProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (currentProcess.stderr) {
      currentProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    if (currentProcess.stdin) {
      currentProcess.stdin.end();
    }

    currentProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(
            `Gemini process exited with code ${code}\nStderr: ${stderr}\nStdout: ${stdout}`,
          ),
        );
      }
    });

    currentProcess.on('error', (err) => {
      reject(err);
    });
  });
}

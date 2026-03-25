import { spawn } from 'node:child_process';
import {
  isGlobalRunning,
  setGlobalRunning,
  registerProcessor,
} from './execution-lock.js';

let opencodeCommand = 'opencode';
const queue = [];
let currentProcess = null;
let currentReject = null;

registerProcessor(processQueue);

export function setOpencodeCommand(command) {
  opencodeCommand = command;
}

export function isOpencodeRunning() {
  return isGlobalRunning();
}

export function cancelOpencodeRequest() {
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

export function runOpencodeRequest(prompt, cwd, options = {}, modelId = null) {
  return new Promise((resolve, reject) => {
    queue.push({
      prompt,
      cwd,
      resolve,
      reject,
      onStart: options.onStart,
      modelId,
    });
    processQueue();
  });
}

async function processQueue() {
  if (isGlobalRunning() || queue.length === 0) return;

  setGlobalRunning(true);
  const { prompt, cwd, resolve, reject, onStart, modelId } = queue.shift();

  const escapedPrompt = prompt.replace(/"/g, '\\"');
  const commandArgs = ['run', `"${escapedPrompt}"`];

  if (modelId) {
    commandArgs.push('--model', `"${modelId.replace(/"/g, '\\"')}"`);
  }

  currentReject = reject;

  try {
    const result = await executeOpencode(commandArgs, cwd, onStart);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    currentProcess = null;
    currentReject = null;
    setGlobalRunning(false);
  }
}

function executeOpencode(args, cwd, onStart) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';

    currentProcess = spawn(opencodeCommand, args, {
      cwd,
      shell: true,
      detached: !isWindows,
      env: { ...process.env, CI: 'true' },
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
            `Opencode process exited with code ${code}\nStderr: ${stderr}\nStdout: ${stdout}`,
          ),
        );
      }
    });

    currentProcess.on('error', (err) => {
      reject(err);
    });
  });
}

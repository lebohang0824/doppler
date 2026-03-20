let isRunning = false;
const processors = [];

/**
 * Registers a function to be called when the lock is released.
 * @param {Function} proc - The function to call (e.g., processQueue).
 */
export function registerProcessor(proc) {
  if (!processors.includes(proc)) {
    processors.push(proc);
  }
}

/**
 * Sets the global running state.
 * @param {boolean} val - True if a process is running, false otherwise.
 */
export function setGlobalRunning(val) {
  isRunning = val;
  if (!val) {
    // Lock released, trigger all processors
    processors.forEach(proc => {
      try {
        proc();
      } catch (e) {
        console.error('Error in processor:', e);
      }
    });
  }
}

/**
 * Returns the global running state.
 * @returns {boolean}
 */
export function isGlobalRunning() {
  return isRunning;
}

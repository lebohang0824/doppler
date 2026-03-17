import { simpleGit } from 'simple-git';
import fs from 'node:fs';

/**
 * Commits all changes in the specified directory.
 * @param {string} dir - The directory path.
 * @param {string} message - The commit message.
 * @returns {Promise<void>}
 */
export async function commit(dir, message) {
  const git = simpleGit(dir);
  await git.add('.');
  await git.commit(message);
}

/**
 * Resets the repository in the specified directory to HEAD.
 * @param {string} dir - The directory path.
 * @returns {Promise<void>}
 */
export async function resetToHead(dir) {
  const git = simpleGit(dir);
  await git.reset(['--hard', 'HEAD']);
}

/**
 * Checks if a directory is initialized as a git repository.
 * If not, initializes it and makes an initial commit.
 * @param {string} dir - The directory path to check/initialize.
 * @returns {Promise<void>}
 */
export async function initializeWithFirstCommit(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const git = simpleGit(dir);

  // checkIsRepo('root') checks if the current directory is the top level of a git repo
  let isRepoRoot = false;
  try {
    isRepoRoot = await git.checkIsRepo('root');
  } catch (e) {
    // If it's not a repo at all, simple-git might throw or return false depending on version
    isRepoRoot = false;
  }

  if (!isRepoRoot) {
    await git.init();
    await git.add('.');
    await git.commit('Initial commit');
  }
}

/**
 * Project resolution: derives a stable project key from the git remote URL
 * and resolves the database path at ~/.config/cachebro/projects/<key>/cache.db.
 *
 * Duplicated from opencode-memelord — same logic, different base directory.
 */
import { createHash } from 'crypto'
import { homedir } from 'os'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import type { PluginInput } from '@opencode-ai/plugin'

type BunShell = PluginInput['$']

// ---------------------------------------------------------------------------
// Project key derivation (cached)
// ---------------------------------------------------------------------------

const projectKeyCache = new Map<string, string>()

/**
 * Derive a stable project key from the git remote URL.
 * Falls back to hashing the worktree path if no remote is available.
 * Results are cached so the hash is only computed once per worktree.
 */
async function getProjectKey(worktree: string, $: BunShell): Promise<string> {
  const cached = projectKeyCache.get(worktree)
  if (cached) return cached

  let source = worktree
  try {
    const remoteUrl = await $`git -C ${worktree} remote get-url origin`
      .quiet()
      .nothrow()
      .text()
    if (remoteUrl.trim()) {
      source = remoteUrl.trim()
    }
  } catch {}

  const key = createHash('sha256').update(source).digest('hex').slice(0, 16)
  projectKeyCache.set(worktree, key)
  return key
}

// ---------------------------------------------------------------------------
// Database path resolution
// ---------------------------------------------------------------------------

export interface ProjectInfo {
  dbPath: string
  projectKey: string
}

export async function resolveProject(
  worktree: string,
  $: BunShell,
): Promise<ProjectInfo> {
  const projectKey = await getProjectKey(worktree, $)
  const dir = join(homedir(), '.config', 'cachebro', 'projects', projectKey)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  return {
    dbPath: join(dir, 'cache.db'),
    projectKey,
  }
}

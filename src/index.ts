/**
 * opencode-cachebro: Standalone OpenCode plugin for cachebro file caching.
 *
 * Uses the cachebro SDK directly — no MCP server, no per-project configuration.
 * Databases are stored globally at ~/.config/cachebro/projects/<project-key>/cache.db,
 * keyed by git remote URL so multiple worktrees share the same cache.
 *
 * Provides:
 *   - cachebro_read_file / cachebro_read_files (cached file reads with diff tracking)
 *   - cachebro_cache_status / cachebro_cache_clear (cache management)
 *   - Automatic file watching for cache invalidation
 */
import type { Plugin } from '@opencode-ai/plugin'
import { createCache } from 'cachebro/packages/sdk/src/index.js'
import { randomUUID } from 'crypto'
import { resolveProject } from './store.js'
import { createTools } from './tools.js'

export const CachebroPlugin: Plugin = async ({ worktree, $ }) => {
  const { dbPath } = await resolveProject(worktree, $)
  const sessionId = randomUUID()

  const { cache, watcher } = createCache({
    dbPath,
    sessionId,
    watchPaths: [worktree],
  })

  await cache.init()

  // Clean up file watchers on process exit
  const cleanup = () => {
    watcher.close()
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('exit', cleanup)

  return {
    tool: createTools(cache),
  }
}

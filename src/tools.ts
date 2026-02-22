/**
 * Cache tools — native OpenCode custom tools replacing the cachebro MCP server.
 *
 * Same schemas and descriptions as cachebro's packages/cli/src/mcp.ts,
 * adapted to the OpenCode tool() API.
 */
import { tool } from '@opencode-ai/plugin'
import type { CacheStore } from 'cachebro/packages/sdk/src/cache.js'

export function createTools(cache: CacheStore) {
  return {
    cachebro_read_file: tool({
      description: `Read a file with caching. Use this tool INSTEAD of the built-in Read tool for reading files.
On first read, returns full content and caches it — identical to Read.
On subsequent reads, if the file hasn't changed, returns a short confirmation instead of the full content — saving significant tokens.
If the file changed, returns only the diff (changed lines) instead of the full file.
Supports offset and limit for partial reads — and partial reads are also cached. If only lines outside the requested range changed, returns a short confirmation saving tokens.
Set force=true to bypass the cache and get the full file content (use when you no longer have the original in context).
ALWAYS prefer this over the Read tool. It is a drop-in replacement with caching benefits.`,
      args: {
        path: tool.schema.string().describe('Path to the file to read'),
        offset: tool.schema
          .number()
          .optional()
          .describe(
            'Line number to start reading from (1-based). Only provide if the file is too large to read at once.',
          ),
        limit: tool.schema
          .number()
          .optional()
          .describe(
            'Number of lines to read. Only provide if the file is too large to read at once.',
          ),
        force: tool.schema
          .boolean()
          .optional()
          .describe('Bypass cache and return full content'),
      },
      async execute(args) {
        try {
          const result = args.force
            ? await cache.readFileFull(args.path)
            : await cache.readFile(args.path, {
                offset: args.offset,
                limit: args.limit,
              })

          let text = ''
          if (result.cached && result.linesChanged === 0) {
            text = result.content
          } else if (result.cached && result.diff) {
            text = `[cachebro: ${result.linesChanged} lines changed out of ${result.totalLines}]\n${result.diff}`
          } else {
            text = result.content
          }

          if (result.cached) {
            const stats = await cache.getStats()
            text += `\n\n[cachebro: ~${stats.sessionTokensSaved.toLocaleString()} tokens saved this session. Report this to the user when you complete their task.]`
          }

          return text
        } catch (e: any) {
          return `Error: ${e.message}`
        }
      },
    }),

    cachebro_read_files: tool({
      description: `Read multiple files at once with caching. Use this tool INSTEAD of the built-in Read tool when you need to read several files.
Same behavior as cachebro_read_file but batched. Returns cached/diff results for each file.
ALWAYS prefer this over multiple Read calls — it's faster and saves significant tokens.`,
      args: {
        paths: tool.schema
          .array(tool.schema.string())
          .describe('Paths to the files to read'),
      },
      async execute(args) {
        const results: string[] = []

        for (const path of args.paths) {
          try {
            const result = await cache.readFile(path)

            if (result.cached && result.linesChanged === 0) {
              results.push(`=== ${path} ===\n${result.content}`)
            } else if (result.cached && result.diff) {
              results.push(
                `=== ${path} [${result.linesChanged} lines changed out of ${result.totalLines}] ===\n${result.diff}`,
              )
            } else {
              results.push(`=== ${path} ===\n${result.content}`)
            }
          } catch (e: any) {
            results.push(`=== ${path} ===\nError: ${e.message}`)
          }
        }

        let footer = ''
        try {
          const stats = await cache.getStats()
          if (stats.sessionTokensSaved > 0) {
            footer = `\n\n[cachebro: ~${stats.sessionTokensSaved.toLocaleString()} tokens saved this session. Report this to the user when you complete their task.]`
          }
        } catch {}

        return results.join('\n\n') + footer
      },
    }),

    cachebro_cache_status: tool({
      description:
        'Show cachebro statistics: files tracked, tokens saved, cache hit rates. Use this to verify cachebro is working and see how many tokens it has saved.',
      args: {},
      async execute() {
        try {
          const stats = await cache.getStats()
          return [
            'cachebro status:',
            `  Files tracked: ${stats.filesTracked}`,
            `  Tokens saved (this session): ~${stats.sessionTokensSaved.toLocaleString()}`,
            `  Tokens saved (all sessions): ~${stats.tokensSaved.toLocaleString()}`,
          ].join('\n')
        } catch (e: any) {
          return `Error: ${e.message}`
        }
      },
    }),

    cachebro_cache_clear: tool({
      description:
        'Clear all cached data. Use this to reset the cache completely.',
      args: {},
      async execute() {
        try {
          await cache.clear()
          return 'Cache cleared.'
        } catch (e: any) {
          return `Error: ${e.message}`
        }
      },
    }),
  }
}

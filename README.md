# opencode-cachebro

[OpenCode](https://opencode.ai) plugin for [cachebro](https://github.com/glommer/cachebro) -- file cache with diff tracking that saves tokens.

## What it does

Drop-in replacement for file reads with intelligent caching. First read returns full content. Subsequent reads return only what changed (or a short "unchanged" confirmation), saving significant tokens.

| Tool | Purpose |
|---|---|
| `cachebro_read_file` | Read a file with caching -- returns diff on changes, confirmation if unchanged |
| `cachebro_read_files` | Batch read multiple files with caching |
| `cachebro_cache_status` | Show files tracked and tokens saved |
| `cachebro_cache_clear` | Reset the cache |

## Install

Add to your global OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "plugin": ["opencode-cachebro"]
}
```

That's it. OpenCode auto-installs the plugin at startup.

## How it works

- **Global database** -- cache is stored at `~/.config/cachebro/projects/<project>/cache.db`, keyed by git remote URL. Multiple worktrees of the same repo share the same database.
- **File watching** -- the plugin watches the project directory for changes and invalidates cache entries automatically.
- **Diff tracking** -- when a file changes between reads, only the diff is returned instead of the full content.
- **Partial reads** -- supports `offset` and `limit` for reading specific line ranges, also cached.

## Requirements

- [OpenCode](https://opencode.ai) v1.0+

## License

MIT

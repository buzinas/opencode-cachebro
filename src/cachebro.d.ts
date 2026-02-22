/**
 * Type declarations for cachebro SDK.
 * The npm package only ships dist/cli.mjs (no types),
 * but it exports the SDK functions we need.
 */
declare module 'cachebro/dist/cli.mjs' {
  export interface CacheConfig {
    dbPath: string
    sessionId: string
    watchPaths?: string[]
  }

  export interface FileReadResult {
    cached: boolean
    content: string
    diff?: string
    linesChanged?: number
    totalLines?: number
    hash: string
  }

  export interface CacheStats {
    filesTracked: number
    tokensSaved: number
    sessionTokensSaved: number
  }

  export class CacheStore {
    constructor(config: CacheConfig)
    init(): Promise<void>
    readFile(
      filePath: string,
      options?: { offset?: number; limit?: number },
    ): Promise<FileReadResult>
    readFileFull(filePath: string): Promise<FileReadResult>
    onFileChanged(filePath: string): Promise<void>
    onFileDeleted(filePath: string): Promise<void>
    getStats(): Promise<CacheStats>
    clear(): Promise<void>
    close(): Promise<void>
  }

  export class FileWatcher {
    constructor(cache: CacheStore, debounceMs?: number)
    watch(paths: string[]): void
    close(): void
  }

  export function createCache(config: CacheConfig): {
    cache: CacheStore
    watcher: FileWatcher
  }
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface FileEntry {
  mtimeMs: number;
  size: number;
}

export interface IndexManifest {
  projectPath: string;
  updatedAt: string;
  files: Record<string, FileEntry>;
}

export interface Chunk {
  id: string;
  path: string;
  text: string;
  startLine: number;
  endLine: number;
}

export interface StoredChunk extends Chunk {
  vector: number[];
}

export interface SearchResult extends Chunk {
  score?: number;
}

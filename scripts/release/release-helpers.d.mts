export const PRIVATE_REFERENCE_SHA256S: ReadonlySet<string>;

export function selectSourceFiles(entries: readonly string[]): string[];
export function findUnsafeArchiveEntries(entries: readonly string[]): string[];
export function findPrivateHashCopies(
  records: readonly { path: string; sha256: string }[],
): string[];
export function isGitLfsPointer(bytes: Uint8Array): boolean;

// global.d.ts (o src/global.d.ts)
declare module "unrar-promise" {
  export interface UnrarFileEntry {
    name: string;
    fileData: Uint8Array;
    fileSize?: number;
    compressedSize?: number;
    isDirectory?: boolean;
  }

  export function unrar(
    source: ArrayBuffer | Uint8Array | Buffer
  ): Promise<UnrarFileEntry[]>;
}

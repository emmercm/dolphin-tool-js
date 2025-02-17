import fs from 'node:fs';
import DolphinToolBin, { DolphinToolRunOptions } from './dolphinToolBin.js';
import { CompressionMethod, CompressionMethodGcz, CompressionMethodWiaRvz } from './common.js';

export interface DolphinToolHeaderOptions extends DolphinToolRunOptions {
  inputFilename: string,
}

// The JSON format that `dolphin-tool` prints
export interface DolphinToolHeader {
  // ISOs won't have a blockSize or compressionMethod
  blockSize?: number,
  compressionMethod?: CompressionMethod,
  compressionLevel?: number,
  // The following will only exist for valid GC/Wii disc images
  country?: string,
  gameId?: string,
  internalName?: string,
  region?: string,
  revision?: number,
}

export default {
  async header(options: DolphinToolHeaderOptions, attempt = 1): Promise<DolphinToolHeader> {
    const output = await DolphinToolBin.run([
      'header',
      '-i', options.inputFilename,
      '-j',
      '-b',
      '-c',
      '-l',
    ], options);

    // Try to detect failures, and then retry them automatically
    if (!output.trim() && attempt <= 3) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * (2 ** (attempt - 1) * 20));
      });
      return this.header(options, attempt + 1);
    }

    const object = JSON.parse(output);

    let compressionMethod: CompressionMethod = CompressionMethodWiaRvz.NONE;
    if (typeof object.compression_method === 'string') {
      if (object.compression_method.toLowerCase() === 'none') {
        compressionMethod = CompressionMethodWiaRvz.NONE;
      } else if (object.compression_method.toLowerCase() === 'zstd'
        || object.compression_method.toLowerCase() === 'zstandard'
      ) {
        compressionMethod = CompressionMethodWiaRvz.ZSTD;
      } else if (object.compression_method.toLowerCase() === 'deflate') {
        compressionMethod = CompressionMethodGcz.DEFLATE;
      } else if (object.compression_method.toLowerCase() === 'bzip2') {
        compressionMethod = CompressionMethodWiaRvz.BZIP2;
      } else if (object.compression_method.toLowerCase() === 'lzma') {
        compressionMethod = CompressionMethodWiaRvz.LZMA;
      } else if (object.compression_method.toLowerCase() === 'lzma2') {
        compressionMethod = CompressionMethodWiaRvz.LZMA2;
      }
    }

    return {
      blockSize: object.block_size,
      compressionLevel: object.compression_level,
      compressionMethod,
      country: object.country,
      gameId: object.game_id,
      internalName: object.internal_name,
      region: object.region,
      revision: object.revision,
    };
  },
};

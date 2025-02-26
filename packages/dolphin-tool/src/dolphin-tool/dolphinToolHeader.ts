import fs from 'node:fs';
import util from 'node:util';
import DolphinToolBin, { DolphinToolRunOptions } from './dolphinToolBin.js';
import { CompressionMethod, CompressionMethodGcz, CompressionMethodWiaRvz } from './common.js';

export interface DolphinToolHeaderOptions extends DolphinToolRunOptions {
  inputFilename: string,
}

// The JSON format that `dolphin-tool` prints
export interface Header {
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

/**
 * Parses information found in file headers.
 */
export default {
  /**
   * Have `dolphin-tool` parse the file header.
   */
  async header(options: DolphinToolHeaderOptions, attempt = 1): Promise<Header> {
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

  /**
   * Read the file header
   */
  async uncompressedSize(inputFilename: string): Promise<bigint> {
    // WIA, RVZ?
    const chunks: Buffer[] = [];
    for await (const chunk of fs.createReadStream(inputFilename, { start: 0, end: 0x24 + 8 })) {
      chunks.push(chunk);
    }
    const contents = Buffer.concat(chunks);

    if (contents.subarray(0, 4).equals(Buffer.from('01C00BB1', 'hex'))) {
      // GCZ
      // @see https://github.com/dolphin-emu/dolphin/blob/1f5e100a0e6dd4f9ab3784fd6373d452054d08bf/Source/Core/DiscIO/CompressedBlob.h#L38
      return contents.subarray(0x10, 0x10 + 8).readBigUInt64LE();
    }

    if (contents.subarray(0, 4).equals(Buffer.from('RVZ\u0001'))) {
      // RVZ
      // @see https://github.com/dolphin-emu/dolphin/blob/f93781d91a90a937973534298b67b789f6a0db0a/docs/WiaAndRvz.md#wia_file_head_t
      return contents.subarray(0x24, 0x24 + 8).readBigUInt64BE();
    }

    if (contents.subarray(0, 4).equals(Buffer.from('WIA\u0001'))) {
      // WIA
      // @see https://github.com/dolphin-emu/dolphin/blob/f93781d91a90a937973534298b67b789f6a0db0a/docs/WiaAndRvz.md#wia_file_head_t
      return contents.subarray(0x24, 0x24 + 8).readBigUInt64BE();
    }

    // ISO
    const stat = await util.promisify(fs.stat)(inputFilename);
    return BigInt(stat.size);
  },
};

import DolphinToolBin, { DolphinToolRunOptions } from './dolphinToolBin.js';
import { CompressionMethodWiaRvz, ContainerFormat } from './common.js';
import utils from './utils.js';

export interface CreateOptions extends DolphinToolRunOptions {
  inputFilename: string,
  outputFilename: string,
  containerFormat: ContainerFormat,
  userFolderPath?: string,
  scrubJunk?: boolean,
  blockSize?: number,
  compressionMethod?: CompressionMethodWiaRvz,
  compressionLevel?: number,
}

export default {
  async convert(options: CreateOptions): Promise<void> {
    const blockSize = options.blockSize ?? {
      // Unchangeable defaults of Dolphin v2412
      [ContainerFormat.ISO]: undefined,
      [ContainerFormat.GCZ]: 32 * 1024,
      [ContainerFormat.WIA]: 2 * 1024 * 1024,
      [ContainerFormat.RVZ]: 128 * 1024,
    }[options.containerFormat];

    const compressionMethod = options.compressionMethod ?? {
      // Defaults of Dolphin v2412
      [ContainerFormat.ISO]: undefined,
      [ContainerFormat.GCZ]: undefined, // deflate
      [ContainerFormat.WIA]: CompressionMethodWiaRvz.NONE,
      [ContainerFormat.RVZ]: CompressionMethodWiaRvz.ZSTD,
    }[options.containerFormat];

    const compressionLevel = options.compressionLevel ?? (
      // Defaults of Dolphin v2412
      compressionMethod !== undefined && compressionMethod !== CompressionMethodWiaRvz.NONE
        ? 5
        : undefined
    );

    const runOptions: string[] = [
      'convert',
      '-i', options.inputFilename,
      '-o', options.outputFilename,
      '-f', options.containerFormat,
      ...(options.scrubJunk ? ['-s'] : []),
      ...(blockSize === undefined ? [] : ['-b', String(blockSize)]),
      ...(compressionMethod === undefined ? [] : ['-c', compressionMethod]),
      ...(compressionLevel === undefined ? [] : ['-l', String(compressionLevel)]),
    ];

    if (process.platform === 'win32' && options.userFolderPath === undefined) {
      /**
       * Windows (and seemingly no other OS) has issues with concurrent or rapid execution of
       * `DolphinTool.exe`, resulting in popups with messages such as:
       *    "IOS_FS: Failed to write new FST"
       *    "IOS_FS: Failed to rename temporary FST file"
       *    "File <userDir>/Wii/shared2/sys/SYSCONF could not be opened! This may happen with
       *      improper permissions or use by another process."
       * To combat this, we have to use separate user directories per process.
       */
      await utils.wrapTempDir(async (temporaryDirectory) => DolphinToolBin.run([
        ...runOptions,
        '-u', temporaryDirectory,
      ], options));
      return;
    }

    await DolphinToolBin.run([
      ...runOptions,
      ...(options.userFolderPath ? ['-u', options.userFolderPath] : []),
    ], options);
  },
};

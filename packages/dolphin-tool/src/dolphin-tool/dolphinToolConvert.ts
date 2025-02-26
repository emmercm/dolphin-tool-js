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
    const runOptions: string[] = [
      'convert',
      '-i', options.inputFilename,
      '-o', options.outputFilename,
      '-f', options.containerFormat,
      ...(options.scrubJunk ? ['-s'] : []),
      ...(options.blockSize === undefined ? [] : ['-b', String(options.blockSize)]),
      ...(options.compressionMethod === undefined ? [] : ['-c', options.compressionMethod]),
      ...(options.compressionLevel === undefined ? [] : ['-l', String(options.compressionLevel)]),
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

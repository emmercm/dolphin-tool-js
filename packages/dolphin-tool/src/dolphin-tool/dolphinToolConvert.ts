import fs from 'node:fs';
import DolphinToolBin, { DolphinToolRunOptions } from './dolphinToolBin.js';
import { CompressionMethodWiaRvz, ContainerFormat } from './common.js';

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
    console.log('exists?', fs.existsSync(options.inputFilename), options.inputFilename);
    await DolphinToolBin.run([
      'convert',
      ...(options.userFolderPath ? ['-u', options.userFolderPath] : []),
      '-i', options.inputFilename,
      '-o', options.outputFilename,
      '-f', options.containerFormat,
      ...(options.scrubJunk ? ['-s'] : []),
      ...(options.blockSize === undefined ? [] : ['-b', String(options.blockSize)]),
      ...(options.compressionMethod === undefined ? [] : ['-c', options.compressionMethod]),
      ...(options.compressionLevel === undefined ? [] : ['-l', String(options.compressionLevel)]),
    ], options);
  },
};

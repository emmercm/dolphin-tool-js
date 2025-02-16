import DolphinToolBin, { DolphinToolRunOptions } from './dolphinToolBin.js';
import { DigestAlgorithm } from './common.js';

export interface VerifyOptions extends DolphinToolRunOptions {
  inputFilename: string,
  userFolderPath?: string,
  digestAlgorithm?: DigestAlgorithm,
}

export interface VerifyDigests {
  crc32?: string,
  md5?: string,
  sha1?: string
  rchash?: string,
}

export default {
  async verify(options: VerifyOptions): Promise<VerifyDigests> {
    const output = await DolphinToolBin.run([
      'verify',
      ...(options.userFolderPath ? ['-u', options.userFolderPath] : []),
      '-i', options.inputFilename,
      ...(options.digestAlgorithm === undefined ? [] : ['-a', options.digestAlgorithm]),
    ], options);

    return {};
  },
};

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
  async verify(options: VerifyOptions, attempt = 1): Promise<VerifyDigests> {
    const output = await DolphinToolBin.run([
      'verify',
      ...(options.userFolderPath ? ['-u', options.userFolderPath] : []),
      '-i', options.inputFilename,
      ...(options.digestAlgorithm === undefined ? [] : ['-a', options.digestAlgorithm]),
    ], options);

    // Try to detect failures, and then retry them automatically
    if (!output.trim() && attempt <= 3) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * (2 ** (attempt - 1) * 20));
      });
      return this.verify(options, attempt + 1);
    }

    const digests: VerifyDigests = {};
    for (const line of output.split(/\r?\n/)) {
      if (line.match(/^crc32\W/i) !== null || options.digestAlgorithm === DigestAlgorithm.CRC32) {
        digests.crc32 = line.match(/[\da-f]{8}/i)?.at(0);
      }
      if (line.match(/^md5\W/i) !== null || options.digestAlgorithm === DigestAlgorithm.MD5) {
        digests.md5 = line.match(/[\da-f]{32}/i)?.at(0);
      }
      if (line.match(/^sha1\W/i) !== null || options.digestAlgorithm === DigestAlgorithm.SHA1) {
        digests.sha1 = line.match(/[\da-f]{40}/i)?.at(0);
      }
      if (line.match(/^rchash\W/i) !== null || options.digestAlgorithm === DigestAlgorithm.RCHASH) {
        digests.rchash = line.match(/[\da-f]{32}/i)?.at(0);
      }
    }
    return digests;
  },
};

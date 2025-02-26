import DolphinToolBin, { DolphinToolRunOptions } from './dolphinToolBin.js';
import { DigestAlgorithm } from './common.js';
import utils from './utils.js';

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
    const runOptions: string[] = [
      'verify',
      '-i', options.inputFilename,
      ...(options.digestAlgorithm === undefined ? [] : ['-a', options.digestAlgorithm]),
    ];

    let output: string;
    // eslint-disable-next-line unicorn/prefer-ternary
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
      output = await utils.wrapTempDir(async (temporaryDirectory) => DolphinToolBin.run([
        ...runOptions,
        '-u', temporaryDirectory,
      ], options));
    } else {
      output = await DolphinToolBin.run([
        ...runOptions,
        ...(options.userFolderPath ? ['-u', options.userFolderPath] : []),
      ], options);
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

    // Try to detect failures, and then retry them automatically
    if (Object.values(digests).filter((value) => value !== undefined).length === 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * (2 ** (attempt - 1) * 20));
      });
      return this.verify(options, attempt + 1);
    }

    return digests;
  },
};

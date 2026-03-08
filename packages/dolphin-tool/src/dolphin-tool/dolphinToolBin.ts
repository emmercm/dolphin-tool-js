import which from 'which';
import util from 'node:util';
import fs from 'node:fs';
import * as child_process from 'node:child_process';
import { Mutex } from 'async-mutex';
import crypto from 'node:crypto';
import path from 'node:path';
import stream from 'node:stream';
import os from 'node:os';

export interface DolphinToolRunOptions {
  binaryPreference?: DolphinToolBinaryPreference
  logStd?: boolean
}

export enum DolphinToolBinaryPreference {
  PREFER_BUNDLED_BINARY = 1,
  PREFER_PATH_BINARY,
}

/**
 * Code to find and interact with the `dolphin-tool` binary.
 */
export default class DolphinToolBin {
  private static DOLPHIN_TOOL_BIN: string | undefined;

  private static readonly DOLPHIN_TOOL_BIN_MUTEX = new Mutex();

  private static async getBinPath(
    binaryPreference?: DolphinToolBinaryPreference,
  ): Promise<string | undefined> {
    if (this.DOLPHIN_TOOL_BIN) {
      return this.DOLPHIN_TOOL_BIN;
    }

    return this.DOLPHIN_TOOL_BIN_MUTEX.runExclusive(async () => {
      if (this.DOLPHIN_TOOL_BIN) {
        return this.DOLPHIN_TOOL_BIN;
      }

      if ((binaryPreference ?? DolphinToolBinaryPreference.PREFER_BUNDLED_BINARY)
      === DolphinToolBinaryPreference.PREFER_BUNDLED_BINARY
      ) {
        const pathBundled = await this.getBinPathBundled();
        this.DOLPHIN_TOOL_BIN = pathBundled ?? (await this.getBinPathExisting());
      } else {
        const pathExisting = await this.getBinPathExisting();
        this.DOLPHIN_TOOL_BIN = pathExisting ?? (await this.getBinPathBundled());
      }

      return this.DOLPHIN_TOOL_BIN;
    });
  }

  private static async getBinPathBundled(): Promise<string | undefined> {
    const bunPath = await this.getBinPathBundledBun();
    if (bunPath !== undefined) {
      return bunPath;
    }

    try {
      const dolphinTool = await import(`@emmercm/dolphin-tool-${process.platform}-${process.arch}`);
      const prebuilt = dolphinTool.default;
      try {
        await util.promisify(fs.stat)(prebuilt);
        return prebuilt;
      } catch {
        /* ignored */
      }
    } catch { /* ignored */ }

    return undefined;
  }

  /**
   * Look for dolphin-tool binaries bundled with:
   * `bun build --compile --asset-naming="[name].[ext]" dolphin-tool *.dylib`
   */
  private static async getBinPathBundledBun(): Promise<string | undefined> {
    try {
      const { embeddedFiles } = await import('bun');

      // Find all files that might be dolphin-tool-related
      const dolphinToolBlob = embeddedFiles.find((blob) => {
        // @ts-expect-error https://github.com/oven-sh/bun/issues/20700
        const blobName: string = blob.name;
        return blobName.toLowerCase().startsWith('dolphin');
      });

      if (dolphinToolBlob !== undefined) {
        // Create the temporary directory
        const hash = crypto.createHash('md5');
        await dolphinToolBlob.stream().pipeTo(new WritableStream({
          write(chunk): void {
            hash.update(chunk);
          },
        }));
        const temporaryDirectory = await this.getTemporaryDirectory(`dolphin-tool-${hash.digest('hex').slice(0, 7)}`);

        // Find additional files that might be necessary
        const dylibBlobs = embeddedFiles.filter((blob) => {
          // @ts-expect-error https://github.com/oven-sh/bun/issues/20700
          const blobName: string = blob.name;
          return blobName.toLowerCase().endsWith('.dylib');
        });

        // Extract all files if necessary
        const temporaryBlobs = await Promise.all(
          [dolphinToolBlob, ...dylibBlobs].map(async (blob) => {
          // @ts-expect-error https://github.com/oven-sh/bun/issues/20700
            const blobName: string = blob.name.replace(/-[\da-z]{8}\./, '.').replace(/\.+$/, '');
            const temporaryBlob = path.join(temporaryDirectory, blobName);
            try {
              await util.promisify(fs.stat)(temporaryBlob);
              return temporaryBlob;
            } catch {
            /* ignored */
            }
            const writableStream = stream.Writable.toWeb(fs.createWriteStream(temporaryBlob));
            await blob.stream().pipeTo(writableStream);
            await util.promisify(fs.chmod)(temporaryBlob, 0o755); // chmod +x
            return temporaryBlob;
          }),
        );
        return temporaryBlobs.find((temporaryBlob) => path.basename(temporaryBlob).startsWith('dolphin'));
      }
    } catch { /* ignored */ }

    return undefined;
  }

  private static async getTemporaryDirectory(temporaryDirectoryBasename: string): Promise<string> {
    const candidateDirectories = [
      path.join(os.tmpdir(), temporaryDirectoryBasename),
      path.join(process.cwd(), '.dolphin-tool', temporaryDirectoryBasename),
      path.join(os.homedir(), '.dolphin-tool', temporaryDirectoryBasename),
    ];
    /* eslint-disable no-await-in-loop */
    for (const candidateDirectory of candidateDirectories) {
      try {
        try {
          await util.promisify(fs.stat)(candidateDirectory);
        } catch {
          await util.promisify(fs.mkdir)(candidateDirectory, { recursive: true });
        }
        const temporaryFile = path.join(candidateDirectory, temporaryDirectoryBasename);
        await util.promisify(fs.writeFile)(temporaryFile, temporaryFile);
        await util.promisify(fs.unlink)(temporaryFile);
        return candidateDirectory;
      } catch {
        /* ignored */
      }
    }
    throw new Error("couldn't find a suitable temporary directory");
  }

  private static async getBinPathExisting(): Promise<string | undefined> {
    const resolved = await which(
      process.platform === 'win32' ? 'DolphinTool.exe' : 'dolphin-tool',
      { nothrow: true },
    );
    if (resolved) {
      return resolved;
    }
    return undefined;
  }

  /**
   * Run dolphin-tool with some arguments.
   */
  static async run(arguments_: string[], options?: DolphinToolRunOptions): Promise<string> {
    const dolphinToolBin = await this.getBinPath(options?.binaryPreference);
    if (!dolphinToolBin) {
      throw new Error('dolphin-tool not found');
    }

    return new Promise<string>((resolve, reject) => {
      const proc = child_process.spawn(dolphinToolBin, arguments_, { windowsHide: true });

      const chunks: Buffer[] = [];

      proc.stdout.on('data', (chunk) => {
        if (options?.logStd) {
          console.log(chunk.toString());
        }

        chunks.push(chunk);
      });

      proc.stderr.on('data', (chunk) => {
        if (options?.logStd) {
          console.error(chunk.toString());
        }

        chunks.push(chunk);
      });

      proc.on('close', (code) => {
        const output = Buffer.concat(chunks).toString().trim();
        if (code !== null && code !== 0) {
          return reject(output);
        }
        return resolve(output);
      });
      proc.on('error', () => {
        const output = Buffer.concat(chunks).toString().trim();
        reject(output);
      });
    });
  }
}

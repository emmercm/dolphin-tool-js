import which from 'which';
import util from 'node:util';
import fs from 'node:fs';
import * as child_process from 'node:child_process';

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

  private static async getBinPath(
    binaryPreference?: DolphinToolBinaryPreference,
  ): Promise<string | undefined> {
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
  }

  private static async getBinPathBundled(): Promise<string | undefined> {
    try {
      const dolphinTool = await import(`@emmercm/dolphin-tool-${process.platform}-${process.arch}`);
      const prebuilt = dolphinTool.default;
      if (await util.promisify(fs.exists)(prebuilt)) {
        return prebuilt;
      }
    } catch { /* ignored */ }

    return undefined;
  }

  private static async getBinPathExisting(): Promise<string | undefined> {
    const resolved = await which('dolphin-tool', { nothrow: true });
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

      const timeout = setTimeout(() => {
        console.log(
          'TIMEOUT!',
          proc.pid,
          proc.connected,
          proc.exitCode,
          arguments_,
          Buffer.concat(chunks).toString().trim(),
        );
      }, 2000);

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
        clearTimeout(timeout);
        const output = Buffer.concat(chunks).toString().trim();
        if (code !== null && code !== 0) {
          return reject(output);
        }
        return resolve(output);
      });
      proc.on('error', () => {
        clearTimeout(timeout);
        const output = Buffer.concat(chunks).toString().trim();
        reject(output);
      });
    });
  }
}

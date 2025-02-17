import fs, { PathLike } from 'node:fs';
import util from 'node:util';
import crypto from 'node:crypto';
import path from 'node:path';

export default {
  /**
   * Asynchronously check the existence of a file.
   */
  async exists(pathLike: PathLike): Promise<boolean> {
    return util.promisify(fs.exists)(pathLike);
  },

  /**
   * Make a random filename in the temporary directory.
   */
  async mktemp(prefix: string): Promise<string> {
    const randomExtension = crypto.randomBytes(4).readUInt32LE().toString(36);
    const filePath = `${prefix.replace(/\.+$/, '')}.${randomExtension}`;
    if (!await this.exists(filePath)) {
      return filePath;
    }
    return this.mktemp(prefix);
  },

  /**
   * Get all files in a path, recursively.
   */
  async walk(pathLike: PathLike): Promise<string[]> {
    let output: string[] = [];

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(pathLike, { withFileTypes: true });
    } catch {
      return [];
    }

    // Depth-first search directories first
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(pathLike.toString(), entry.name));
    for (const directory of directories) {
      // eslint-disable-next-line no-await-in-loop
      const subDirectoryFiles = await this.walk(directory);
      output = [...output, ...subDirectoryFiles];
    }

    const files = entries
      .filter((entry) => !entry.isDirectory())
      .map((entry) => path.join(pathLike.toString(), entry.name));
    output = [...output, ...files];

    return output;
  },
};

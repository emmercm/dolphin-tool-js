import util from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export default {
  async wrapTempDir<T>(runnable: (temporaryDirectory: string) => T | Promise<T>): Promise<T> {
    const temporaryDirectory = await util.promisify(fs.mkdtemp)(path.join(os.tmpdir(), 'dolphin-tool-'));

    try {
      return await runnable(temporaryDirectory);
    } finally {
      await util.promisify(fs.rm)(temporaryDirectory, { recursive: true, force: true });
    }
  },
};

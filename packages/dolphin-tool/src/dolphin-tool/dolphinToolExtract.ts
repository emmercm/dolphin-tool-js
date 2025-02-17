import fs from 'node:fs';
import DolphinToolBin, { DolphinToolRunOptions } from './dolphinToolBin.js';

export interface DolphinToolListOptions extends DolphinToolRunOptions {
  inputFilename: string,
}

export interface DolphinToolExtractOptions extends DolphinToolRunOptions {
  inputFilename: string,
  outputFolder: string,
  partition?: string,
  single?: string,
  gameOnly?: boolean,
}

export default {
  async listFiles(options: DolphinToolListOptions, attempt = 1): Promise<string[]> {
    console.log('exists?', fs.existsSync(options.inputFilename), options.inputFilename);
    const output = await DolphinToolBin.run([
      'extract',
      '-i', options.inputFilename,
      '-l',
    ], options);

    const files = output.split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    // Try to detect failures, and then retry them automatically
    if (files.length === 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.random() * (2 ** (attempt - 1) * 20));
      });
      return this.listFiles(options, attempt + 1);
    }

    return files;
  },

  async extract(options: DolphinToolExtractOptions): Promise<void> {
    console.log('exists?', fs.existsSync(options.inputFilename), options.inputFilename);
    await DolphinToolBin.run([
      'extract',
      '-i', options.inputFilename,
      '-o', options.outputFolder,
      ...(options.partition ? ['-p', options.partition] : []),
      ...(options.single ? ['-s', options.single] : []),
      ...(options.gameOnly ? ['-g'] : []),
    ], options);
  },
};

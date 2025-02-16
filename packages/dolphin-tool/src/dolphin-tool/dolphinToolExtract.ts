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
  async listFiles(options: DolphinToolListOptions): Promise<string[]> {
    const output = await DolphinToolBin.run([
      'extract',
      '-i', options.inputFilename,
      '-l',
    ], options);
    return output.split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
  },

  async extract(options: DolphinToolExtractOptions): Promise<void> {
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

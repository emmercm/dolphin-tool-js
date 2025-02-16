import DolphinToolBin, { DolphinToolRunOptions } from './dolphinToolBin.js';

export interface DolphinToolExtractOptions extends DolphinToolRunOptions {
  inputFilename: string,
  outputFolder: string,
  partition?: string,
  single?: string,
  gameOnly?: boolean,
}

export default {
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

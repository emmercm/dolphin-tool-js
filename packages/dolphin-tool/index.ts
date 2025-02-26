import DolphinToolBin from './src/dolphin-tool/dolphinToolBin.js';
import DolphinToolHelp from './src/dolphin-tool/dolphinToolHelp.js';
import DolphinToolConvert from './src/dolphin-tool/dolphinToolConvert.js';
import DolphinToolVerify from './src/dolphin-tool/dolphinToolVerify.js';
import DolphinToolHeader from './src/dolphin-tool/dolphinToolHeader.js';
import DolphinToolExtract from './src/dolphin-tool/dolphinToolExtract.js';

export * from './src/dolphin-tool/common.js';
export * from './src/dolphin-tool/dolphinToolBin.js';
export * from './src/dolphin-tool/dolphinToolConvert.js';
export * from './src/dolphin-tool/dolphinToolExtract.js';
export * from './src/dolphin-tool/dolphinToolHeader.js';
export * from './src/dolphin-tool/dolphinToolHelp.js';
export * from './src/dolphin-tool/dolphinToolVerify.js';

export default {
  run: DolphinToolBin.run,

  help: DolphinToolHelp.help,

  convert: DolphinToolConvert.convert,
  verify: DolphinToolVerify.verify,
  header: DolphinToolHeader.header,
  uncompressedSize: DolphinToolHeader.uncompressedSize,
  listFiles: DolphinToolExtract.listFiles,
  extract: DolphinToolExtract.extract,
};

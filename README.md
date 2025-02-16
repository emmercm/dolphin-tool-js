<h1 align="center">🐬 dolphin-tool</h1>

<p align="center"><b>Pre-compiled binaries and Node.js wrapper for Dolphin's <a href="https://github.com/dolphin-emu/dolphin/tree/master/Source/Core/DolphinTool">dolphin-tool</a>.</b></p>

<p align="center">
  <a href="https://www.npmjs.com/package/dolphin-tool"><img alt="npm: version" src="https://img.shields.io/npm/v/dolphin-tool?color=%23cc3534&label=version&logo=npm&logoColor=white"></a>
  <a href="https://www.npmjs.com/package/dolphin-tool"><img alt="npm: downloads" src="https://img.shields.io/npm/dt/dolphin-tool?color=%23cc3534&logo=npm&logoColor=white"></a>
  <a href="https://github.com/emmercm/dolphin-tool-js"><img alt="GitHub: stars" src="https://img.shields.io/github/stars/emmercm/dolphin-tool-js?style=flat&logo=github&logoColor=white&color=%236e5494"></a>
  <a href="https://github.com/emmercm/dolphin-tool-js/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/github/license/emmercm/dolphin-tool-js?color=blue"></a>
</p>

## Supported platforms

| OS      | Architectures                                               | Additional Instructions |
|---------|-------------------------------------------------------------|-------------------------|
| Windows | <ul><li>x64</li><li>arm64</li></ul>                         |                         |
| macOS   | <ul><li>arm64 (Apple Silicon)</li><li>x64 (Intel)</li></ul> |                         |
| Linux   | <ul><li>x64</li><li>arm v7</li><li>arm64 v8</li></ul>       |                         |

## Running

You can easily run the `dolphin-tool` binary for your OS from the command line like this:

```shell
npx dolphin-tool [command] [options..]
```

Examples:

```shell
npx dolphin-tool --help
npx dolphin-tool header -i Image.rvz
npx dolphin-tool verify -i Image.rvz -a md5
```

## Installation

```shell
npm install --save dolphin-tool
```

## Usage

```javascript
import dolphinTool from 'dolphin-tool';

/**
 * Create images
 */
await dolphinTool.convert({
  inputFilename: 'image.iso',
  outputFilename: 'image.rvz',
  containerFormat: ContainerFormat.RVZ,
  blockSize: 131_072,
  compressionMethod: CompressionMethodWiaRvz.ZSTD,
  compressionLevel: 5,
});
console.log(await dolphinTool.header({ inputFilename: 'image.rvz' }));
// { blockSize: 131072, compressionMethod: 'zstd', compressionLevel: 5, ... }


/**
 * Verify images
 */
const digests = await dolphinTool.verify({
  inputFilename: 'image.gcz',
  digestAlgorithm: DigestAlgorithm.MD5,
});
console.log(digests.md5);
// 0d6e1901...


/**
 * Extract files
 */
const files = await dolphinTool.listFiles({
  inputFilename: 'image.wia',
});
console.log(files);
// [ ... ]
await dolphinTool.extract({
  inputFilename: 'image.wia',
  outputFolder: './'
});
```

## License

[Dolphin](https://github.com/dolphin-emu/dolphin) itself is licensed under the GPLv2 license but is ["overall...compatible with the GPLv3 license"](https://github.com/dolphin-emu/dolphin/blob/master/COPYING).

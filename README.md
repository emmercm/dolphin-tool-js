<h1 align="center">🐬 dolphin-tool</h1>

<p align="center"><b>Pre-compiled binaries and Node.js wrapper for Dolphin's <a href="https://github.com/dolphin-emu/dolphin/tree/master/Source/Core/DolphinTool">dolphin-tool</a>.</b></p>

<p align="center">
  <a href="https://www.npmjs.com/package/dolphin-tool"><img alt="npm: version" src="https://img.shields.io/npm/v/dolphin-tool?color=%23cc3534&label=version&logo=npm&logoColor=white"></a>
  <a href="https://www.npmjs.com/package/dolphin-tool"><img alt="npm: downloads" src="https://img.shields.io/npm/dt/dolphin-tool?color=%23cc3534&logo=npm&logoColor=white"></a>
  <a href="https://github.com/emmercm/dolphin-tool-js"><img alt="GitHub: stars" src="https://img.shields.io/github/stars/emmercm/dolphin-tool-js?style=flat&logo=github&logoColor=white&color=%236e5494"></a>
  <a href="https://github.com/emmercm/dolphin-tool-js/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/github/license/emmercm/dolphin-tool-js?color=blue"></a>
</p>

## Supported platforms

| OS      | Architectures                                               | Additional Instructions                                                                              |
|---------|-------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| Windows | <ul><li>x64</li><li>arm64</li></ul>                         |                                                                                                      |
| macOS   | <ul><li>arm64 (Apple Silicon)</li><li>x64 (Intel)</li></ul> | [libusb](https://libusb.info/) is required to be installed separately:<pre>brew install libusb</pre> |
| Linux   | <ul><li>x64</li><li>arm v7</li><li>arm64 v8</li></ul>       |                                                                                                      |

## Running

You can easily run the `dolphin-tool` binary for your OS from the command line like this:

```shell
npx dolphin-tool [options..]
```

Examples:

TODO

## Installation

```shell
npm install --save dolphin-tool
```

## Usage

TODO

## License

[Dolphin](https://github.com/dolphin-emu/dolphin) itself is licensed under the GPLv2 license but is ["overall...compatible with the GPLv3 license"](https://github.com/dolphin-emu/dolphin/blob/master/COPYING).

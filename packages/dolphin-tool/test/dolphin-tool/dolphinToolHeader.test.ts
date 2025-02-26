import path from 'node:path';
import os from 'node:os';
import util from 'node:util';
import fs from 'node:fs';
import DolphinToolHeader from '../../src/dolphin-tool/dolphinToolHeader.js';
import { CompressionMethodGcz, CompressionMethodWiaRvz, ContainerFormat } from '../../src/dolphin-tool/common.js';
import DolphinToolConvert from '../../src/dolphin-tool/dolphinToolConvert.js';
import TestUtil from '../testUtil.js';

describe('header', () => {
  test.each([
    path.join('test', 'fixtures', 'gcz', '4096.gcz'),
    path.join('test', 'fixtures', 'gcz', '6144.gcz'),
  ])('should get header for GCZ: %s', async (inputFilename) => {
    const header = await DolphinToolHeader.header({ inputFilename });
    expect(header.blockSize).toBeDefined();
    expect(header.compressionMethod).toEqual(CompressionMethodGcz.DEFLATE);
    expect(header.compressionLevel).toBeUndefined();
  });

  test.each([
    path.join('test', 'fixtures', 'iso', '2048.iso'),
    path.join('test', 'fixtures', 'iso', '16384.iso'),
    path.join('test', 'fixtures', 'iso', 'GameCube-240pSuite-1.19.iso'),
  ])('should get header for ISO: %s', async (inputFilename) => {
    const header = await DolphinToolHeader.header({ inputFilename });
    expect(header.blockSize).toBeUndefined();
    expect(header.compressionMethod).toEqual(CompressionMethodWiaRvz.NONE);
    expect(header.compressionLevel).toBeUndefined();
  });

  test.each([
    path.join('test', 'fixtures', 'rvz', '8192.rvz'),
    path.join('test', 'fixtures', 'rvz', '10240.rvz'),
  ])('should get header for RVZ: %s', async (inputFilename) => {
    const header = await DolphinToolHeader.header({ inputFilename });
    expect(header.blockSize).toBeDefined();
    expect(header.compressionMethod).toBeDefined();
    expect(header.compressionLevel).toBeDefined();
  });

  test.each([
    path.join('test', 'fixtures', 'wia', '12288.wia'),
    path.join('test', 'fixtures', 'wia', '14336.wia'),
  ])('should get header for WIA: %s', async (inputFilename) => {
    const header = await DolphinToolHeader.header({ inputFilename });
    expect(header.blockSize).toBeDefined();
    expect(header.compressionMethod).toBeDefined();
    expect(header.compressionLevel).toBeDefined();
  });
});

describe('uncompressedSize', () => {
  describe.each([
    [path.join('test', 'fixtures', 'iso', 'GameCube-240pSuite-1.19.iso'), BigInt(1_671_168)],
  ])('%s', (inputFilename, expectedUncompressedSize) => {
    test.each(
      Object.keys(ContainerFormat)
        .filter((format) => Number.isNaN(Number(format)))
        .map((format) => ([format])),
    )('should get uncompressed size: %s', async (containerFormatKey) => {
      const containerFormat = ContainerFormat[containerFormatKey as keyof typeof ContainerFormat];

      const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.${containerFormat.toLowerCase()}`;

      try {
        await DolphinToolConvert.convert({
          inputFilename,
          outputFilename: temporaryFile,
          containerFormat,
        });

        const uncompressedSize = await DolphinToolHeader.uncompressedSize(inputFilename);
        expect(uncompressedSize).toEqual(expectedUncompressedSize);
      } finally {
        await util.promisify(fs.rm)(temporaryFile, { force: true });
      }
    });
  });
});

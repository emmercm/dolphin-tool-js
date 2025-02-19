import path from 'node:path';
import DolphinToolHeader from '../../src/dolphin-tool/dolphinToolHeader.js';
import { CompressionMethodGcz, CompressionMethodWiaRvz } from '../../src/dolphin-tool/common.js';

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

import path from 'node:path';
import os from 'node:os';
import util, { promisify } from 'node:util';
import fs from 'node:fs';
import DolphinToolConvert from '../../src/dolphin-tool/dolphinToolConvert.js';
import TestUtil from '../testUtil.js';
import { CompressionMethodGcz, CompressionMethodWiaRvz, ContainerFormat } from '../../src/dolphin-tool/common.js';
import DolphinToolHeader from '../../src/dolphin-tool/dolphinToolHeader.js';

it('should fail on nonexistent file', async () => {
  const containerFormat = ContainerFormat.ISO;
  const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.${containerFormat.toLowerCase()}`;

  try {
    await expect(DolphinToolConvert.convert({
      inputFilename: os.devNull,
      outputFilename: temporaryFile,
      containerFormat,
    })).rejects.toBeTruthy();
  } finally {
    await promisify(fs.rm)(temporaryFile, { force: true });
  }
});

describe.each([
  path.join('test', 'fixtures', 'gcz', '4096.gcz'),
  path.join('test', 'fixtures', 'gcz', '6144.gcz'),
  path.join('test', 'fixtures', 'iso', '2048.iso'),
  path.join('test', 'fixtures', 'iso', '16384.iso'),
  path.join('test', 'fixtures', 'iso', 'GameCube-240pSuite-1.19.iso'),
  path.join('test', 'fixtures', 'rvz', '8192.rvz'),
  path.join('test', 'fixtures', 'rvz', '10240.rvz'),
  path.join('test', 'fixtures', 'wia', '12288.wia'),
  path.join('test', 'fixtures', 'wia', '14336.wia'),
])('%s', (inputFilename) => {
  it('iso', async () => {
    const containerFormat = ContainerFormat.ISO;
    const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(inputFilename)))}.${containerFormat.toLowerCase()}`;

    try {
      const convert = await DolphinToolConvert.convert({
        inputFilename,
        outputFilename: temporaryFile,
        containerFormat,
      });
      if (!(await TestUtil.exists(temporaryFile))) {
        throw new Error(convert);
      }
      const temporaryFileStat = await util.promisify(fs.stat)(temporaryFile);
      expect(temporaryFileStat.size).toBeGreaterThan(0);

      const header = await DolphinToolHeader.header({
        inputFilename: temporaryFile,
      });

      expect(header.blockSize).toBeUndefined();
      expect(header.compressionMethod).toEqual(CompressionMethodWiaRvz.NONE);
      expect(header.compressionLevel).toBeUndefined();
    } finally {
      await promisify(fs.rm)(temporaryFile, { force: true });
    }
  });

  it('gcz', async () => {
    const containerFormat = ContainerFormat.GCZ;
    const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(inputFilename)))}.${containerFormat.toLowerCase()}`;

    try {
      const convertOptions = {
        inputFilename,
        outputFilename: temporaryFile,
        containerFormat,
      };
      const convert = await DolphinToolConvert.convert(convertOptions);
      if (!(await TestUtil.exists(temporaryFile))) {
        throw new Error(convert);
      }
      const temporaryFileStat = await util.promisify(fs.stat)(temporaryFile);
      expect(temporaryFileStat.size).toBeGreaterThan(0);

      const header = await DolphinToolHeader.header({
        inputFilename: temporaryFile,
      });

      expect(header.blockSize).toBeGreaterThan(0);
      expect(header.compressionMethod).toEqual(CompressionMethodGcz.DEFLATE);
      expect(header.compressionLevel).toBeUndefined();
    } finally {
      await promisify(fs.rm)(temporaryFile, { force: true });
    }
  });

  describe.each([
    ContainerFormat.WIA,
    ContainerFormat.RVZ,
  ])('%s', (containerFormat) => {
    test.each(
      Object.keys(CompressionMethodWiaRvz)
        .filter((method) => Number.isNaN(Number(method)))
        .map((method) => ([method])),
    )('%s', async (compressionMethodKey) => {
      const compressionMethod = CompressionMethodWiaRvz[
        compressionMethodKey as keyof typeof CompressionMethodWiaRvz
      ];

      // Incompatible options
      if (containerFormat === ContainerFormat.WIA
        && compressionMethod === CompressionMethodWiaRvz.ZSTD
      ) {
        return;
      }

      const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(inputFilename)))}.${containerFormat.toLowerCase()}`;

      try {
        const convertOptions = {
          inputFilename,
          outputFilename: temporaryFile,
          containerFormat,
          compressionMethod,
        };
        const convert = await DolphinToolConvert.convert(convertOptions);
        if (!(await TestUtil.exists(temporaryFile))) {
          throw new Error(convert);
        }
        const temporaryFileStat = await util.promisify(fs.stat)(temporaryFile);
        expect(temporaryFileStat.size).toBeGreaterThan(0);

        const header = await DolphinToolHeader.header({
          inputFilename: temporaryFile,
        });

        expect(header.blockSize).toBeGreaterThan(0);
        expect(header.compressionMethod).toEqual(compressionMethod);
        expect(header.compressionLevel).toEqual(
          compressionMethod === CompressionMethodWiaRvz.NONE ? 0 : 5,
        );
      } finally {
        await promisify(fs.rm)(temporaryFile, { force: true });
      }
    });
  });
});

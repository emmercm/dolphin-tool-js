import path from 'node:path';
import os from 'node:os';
import util, { promisify } from 'node:util';
import fs from 'node:fs';
import DolphinToolVerify, { VerifyDigests } from '../../src/dolphin-tool/dolphinToolVerify.js';
import { ContainerFormat, DigestAlgorithm } from '../../src/dolphin-tool/common.js';
import TestUtil from '../testUtil.js';
import DolphinToolConvert from '../../src/dolphin-tool/dolphinToolConvert.js';

it('should fail on nonexistent file', async () => {
  const temporaryDirectory = await util.promisify(fs.mkdtemp)(path.join(os.tmpdir(), 'temp-'));

  try {
    await expect(DolphinToolVerify.verify({
      inputFilename: os.devNull,
    })).rejects.toBeTruthy();
  } finally {
    await promisify(fs.rm)(temporaryDirectory, { recursive: true, force: true });
  }
});

describe.each([
  path.join('test', 'fixtures', 'iso', 'GameCube-240pSuite-1.19.iso'),
])('%s', (inputFilename) => {
  describe.each(
    Object.keys(ContainerFormat)
      .filter((format) => Number.isNaN(Number(format)))
      .map((format) => ([format])),
  )('%s', (containerFormatKey) => {
    const containerFormat = ContainerFormat[containerFormatKey as keyof typeof ContainerFormat];

    it('should verify default', async () => {
      const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(inputFilename)))}.${containerFormat.toLowerCase()}`;
      try {
        await DolphinToolConvert.convert({
          inputFilename,
          outputFilename: temporaryFile,
          containerFormat,
        });

        const digests = await DolphinToolVerify.verify({
          inputFilename: temporaryFile,
        });
        expect(digests.crc32).toBeDefined();
        expect(digests.md5).toBeUndefined();
        expect(digests.sha1).toBeDefined();
        expect(digests.rchash).toBeUndefined();
      } finally {
        await promisify(fs.rm)(temporaryFile, { force: true });
      }
    });

    test.each([
      [DigestAlgorithm.CRC32, 'crc32'],
      [DigestAlgorithm.MD5, 'md5'],
      [DigestAlgorithm.SHA1, 'sha1'],
      [DigestAlgorithm.RCHASH, 'rchash'],
    ] satisfies [DigestAlgorithm, keyof VerifyDigests][])('should verify: %s', async (digestAlgorithm, digestKey) => {
      const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(inputFilename)))}.${containerFormat.toLowerCase()}`;
      try {
        await DolphinToolConvert.convert({
          inputFilename,
          outputFilename: temporaryFile,
          containerFormat,
        });

        const digests = await DolphinToolVerify.verify({
          inputFilename: temporaryFile,
          digestAlgorithm,
        });
        expect(digests[digestKey]).toBeDefined();
        delete digests[digestKey];
        expect(digests).toEqual({});
      } finally {
        await promisify(fs.rm)(temporaryFile, { force: true });
      }
    });
  });
});

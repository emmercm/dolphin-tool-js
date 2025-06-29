import path from 'node:path';
import os from 'node:os';
import util, { promisify } from 'node:util';
import fs from 'node:fs';
import { ContainerFormat } from '../../src/dolphin-tool/common.js';
import DolphinToolExtract from '../../src/dolphin-tool/dolphinToolExtract.js';
import DolphinToolConvert from '../../src/dolphin-tool/dolphinToolConvert.js';
import TestUtil from '../testUtil.js';

it('should fail on nonexistent file', async () => {
  const temporaryDirectory = await util.promisify(fs.mkdtemp)(path.join(os.tmpdir(), 'temp-'));

  try {
    await expect(DolphinToolExtract.extract({
      inputFilename: os.devNull,
      outputFolder: temporaryDirectory,
    })).rejects.toBeTruthy();
  } finally {
    await promisify(fs.rm)(temporaryDirectory, { recursive: true, force: true });
  }
});

describe.each([
  [path.join('test', 'fixtures', 'iso', 'GameCube-240pSuite-1.19.iso'), ['opening.bnr']],
])('%s', (inputFilename, imageFiles) => {
  describe.each(
    Object.keys(ContainerFormat)
      .filter((format) => Number.isNaN(Number(format)))
      .map((format) => ([format])),
  )('%s', (containerFormatKey) => {
    const containerFormat = ContainerFormat[containerFormatKey as keyof typeof ContainerFormat];

    it('should list', async () => {
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

        const files = await DolphinToolExtract.listFiles({ inputFilename: temporaryFile });
        expect(files).toEqual(imageFiles);
      } finally {
        await promisify(fs.rm)(temporaryFile, { force: true });
      }
    });

    it('should extract all', async () => {
      const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(inputFilename)))}.${containerFormat.toLowerCase()}`;
      const temporaryDirectory = await util.promisify(fs.mkdtemp)(path.join(os.tmpdir(), 'temp-'));
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

        await DolphinToolExtract.extract({
          inputFilename: temporaryFile,
          outputFolder: temporaryDirectory,
        });
        const extractedFiles = await TestUtil.walk(path.join(temporaryDirectory, 'files'));
        expect(extractedFiles).toEqual(imageFiles.map((file) => path.join(temporaryDirectory, 'files', file)));
      } finally {
        await promisify(fs.rm)(temporaryFile, { force: true });
        await promisify(fs.rm)(temporaryDirectory, { recursive: true, force: true });
      }
    });

    test.each(
      imageFiles.map((file) => ([file])),
    )('should extract single: %s', async (imageFile) => {
      const temporaryFile = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(inputFilename)))}.${containerFormat.toLowerCase()}`;
      const temporaryDirectory = await util.promisify(fs.mkdtemp)(path.join(os.tmpdir(), 'temp-'));
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

        await DolphinToolExtract.extract({
          inputFilename: temporaryFile,
          outputFolder: temporaryDirectory,
          single: imageFile,
        });
        const extractedFiles = await TestUtil.walk(path.join(temporaryDirectory));
        expect(extractedFiles).toEqual(imageFiles.map((file) => path.join(temporaryDirectory, 'files', file)));
      } finally {
        await promisify(fs.rm)(temporaryFile, { force: true });
        await promisify(fs.rm)(temporaryDirectory, { recursive: true, force: true });
      }
    });
  });
});

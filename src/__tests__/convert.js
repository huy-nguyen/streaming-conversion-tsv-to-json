import {
  convert,
} from '../simpleConvert';
import {
  convert as advancedConvert,
} from '../advancedConvert';
const realFs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(realFs.readFile);
const fakeInputDir = path.join(__dirname, 'fakeInputDir');
const fakeOutputDir = path.join(__dirname, 'fakeOutputDir');
const fakeInputFileName = 'fakeInputFile';

// Need to have this empty `console.log` to avoid error.
// https://github.com/facebook/jest/issues/5792
/* eslint-disable-next-line no-console */
console.log('');

let mockFs;

afterEach(() => {
  mockFs.restore();
});

describe('Simple example', () => {

  test('With many rows of input data', async () => {
    const testInput = await readFile(path.join(__dirname, 'simpleInput.tsv'), 'utf8');
    const expectedOutput = require('./simpleOutput.json');

    mockFs = require('mock-fs');
    mockFs({
      [fakeInputDir]: {
        [`${fakeInputFileName}.tsv`]: testInput,
      },
      [fakeOutputDir]: {
        [`${fakeInputFileName}.json`]: '',
      },
    });

    const inputPath = path.join(fakeInputDir, `${fakeInputFileName}.tsv`);
    const outputPath = path.join(fakeOutputDir, `${fakeInputFileName}.json`);

    await convert({inputPath, outputPath, shouldLogProgress: false});

    const actualOutputFile = await readFile(outputPath, 'utf8');
    const actualOutput = JSON.parse(actualOutputFile);

    expect(actualOutput).toEqual(expectedOutput);
  });

  test('With one row of input data', async () => {
    const testInput = await readFile(path.join(__dirname, 'simpleInputSingleRow.tsv'), 'utf8');
    const expectedOutput = require('./simpleOutputSingleRow.json');

    mockFs = require('mock-fs');
    mockFs({
      [fakeInputDir]: {
        [`${fakeInputFileName}.tsv`]: testInput,
      },
      [fakeOutputDir]: {
        [`${fakeInputFileName}.json`]: '',
      },
    });

    const inputPath = path.join(fakeInputDir, `${fakeInputFileName}.tsv`);
    const outputPath = path.join(fakeOutputDir, `${fakeInputFileName}.json`);

    await convert({inputPath, outputPath, shouldLogProgress: false});

    const actualOutputFile = await readFile(outputPath, 'utf8');
    const actualOutput = JSON.parse(actualOutputFile);

    expect(actualOutput).toEqual(expectedOutput);
  });
  test('With empty input data', async () => {
    mockFs = require('mock-fs');
    mockFs({
      [fakeInputDir]: {
        [`${fakeInputFileName}.tsv`]: '',
      },
      [fakeOutputDir]: {
        [`${fakeInputFileName}.json`]: '',
      },
    });

    const inputPath = path.join(fakeInputDir, `${fakeInputFileName}.tsv`);
    const outputPath = path.join(fakeOutputDir, `${fakeInputFileName}.json`);

    await convert({inputPath, outputPath, shouldLogProgress: false});

    const actualOutputFile = await readFile(outputPath, 'utf8');
    const actualOutput = JSON.parse(actualOutputFile);

    expect(actualOutput).toEqual([]);
  });
});

describe('Advanced example', () => {

  test('With many rows of input data', async () => {
    const testInput = await readFile(path.join(__dirname, 'advancedInput.tsv'), 'utf8');
    const expectedOutput = require('./advancedOutput.json');

    mockFs = require('mock-fs');
    mockFs({
      [fakeInputDir]: {
        [`${fakeInputFileName}.tsv`]: testInput,
      },
      [fakeOutputDir]: {
        [`${fakeInputFileName}.json`]: '',
      },
    });

    const inputPath = path.join(fakeInputDir, `${fakeInputFileName}.tsv`);
    const outputPath = path.join(fakeOutputDir, `${fakeInputFileName}.json`);

    await advancedConvert({inputPath, outputPath, shouldLogProgress: false});

    const actualOutputFile = await readFile(outputPath, 'utf8');
    const actualOutput = JSON.parse(actualOutputFile);

    expect(actualOutput).toEqual(expectedOutput);
  });

  test('With one row of input data', async () => {
    const testInput = await readFile(path.join(__dirname, 'advancedInputSingleRow.tsv'), 'utf8');
    const expectedOutput = require('./advancedOutputSingleRow.json');

    mockFs = require('mock-fs');
    mockFs({
      [fakeInputDir]: {
        [`${fakeInputFileName}.tsv`]: testInput,
      },
      [fakeOutputDir]: {
        [`${fakeInputFileName}.json`]: '',
      },
    });

    const inputPath = path.join(fakeInputDir, `${fakeInputFileName}.tsv`);
    const outputPath = path.join(fakeOutputDir, `${fakeInputFileName}.json`);

    await advancedConvert({inputPath, outputPath, shouldLogProgress: false});

    const actualOutputFile = await readFile(outputPath, 'utf8');
    const actualOutput = JSON.parse(actualOutputFile);

    expect(actualOutput).toEqual(expectedOutput);
  });

  test('With empty input data', async () => {

    mockFs = require('mock-fs');
    mockFs({
      [fakeInputDir]: {
        [`${fakeInputFileName}.tsv`]: '',
      },
      [fakeOutputDir]: {
        [`${fakeInputFileName}.json`]: '',
      },
    });

    const inputPath = path.join(fakeInputDir, `${fakeInputFileName}.tsv`);
    const outputPath = path.join(fakeOutputDir, `${fakeInputFileName}.json`);

    await advancedConvert({inputPath, outputPath, shouldLogProgress: false});

    const actualOutputFile = await readFile(outputPath, 'utf8');
    const actualOutput = JSON.parse(actualOutputFile);

    expect(actualOutput).toEqual([]);
  });
});

import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import util from 'util';
import {
  convert,
} from './advancedConvert';

const remove = util.promisify(rimraf);
const mkdir = util.promisify(fs.mkdir);

const defaultInputDir = 'realInput';
const defaultOutputDir = 'realOutput';

const convertFile = async () => {

  const outputDir = path.join(__dirname, '..', defaultOutputDir);

  try {
    await remove(outputDir);
    await mkdir(outputDir);
    await convert({
      inputPath: path.join(__dirname, '..', defaultInputDir, 'title.principals.tsv'),
      outputPath: path.join(outputDir, 'title.principals.json'),
    });
  } catch (e) {
    console.error(e);
  }
};

convertFile();

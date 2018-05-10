import parse from 'csv-parse';
import fs from 'fs';
import transform from 'stream-transform';
import util from 'util';

const writeFile = util.promisify(fs.writeFile);
const appendFile = util.promisify(fs.appendFile);

interface Options {
  outputPath: string;
  inputPath: string;
  shouldLogProgress?: boolean;
}

interface RawRow {
  tconst: string;
  titleType: string;
  primaryTitle: string;
  originalTitle: string;
  isAdult: string;
  startYear: string;
  endYear: string;
  runtimeMinutes: string;
  genres: string;
}

interface ParsedRow {
  tconst: string;
  titleType: string;
  primaryTitle: string;
  originalTitle: string;
  isAdult: boolean;
  startYear: number;
  endYear: number | null;
  runtimeMinutes: number | null;
  genres: string[];
}
export const convert =
  ({outputPath, inputPath, shouldLogProgress = true}: Options): Promise<void> => new Promise<void>(
    async (resolve, reject) => {
      try {
        // create empty output file. Otherwise, we wont' be able to create a writable
        // stream for output:
        await writeFile(outputPath, '', 'utf8');

        const source = fs.createReadStream(inputPath, 'utf8');
        const destination = fs.createWriteStream(outputPath, 'utf8');

        const parser = parse({
          // Because the input is tab-delimited:
          delimiter: '\t',
          // Because we want the library to automatically associate the column name
          // with column value in each row for us:
          columns: true,
          // Because we don't want accidental quotes inside a column to be
          // interpreted as "wrapper" for that column content:
          quote: false,
        });

        let outputIndex = 0;
        const transformer = transform((rawRow: RawRow): string => {
          const currentRecordIndex = outputIndex;
          outputIndex += 1;
          if (outputIndex % 100000 === 0 && shouldLogProgress === true) {
            console.info('processing row ', outputIndex);
          }
          const {isAdult, startYear, endYear, runtimeMinutes, genres, ...rest} = rawRow;
          const parsedRow: ParsedRow = {
            ...rest,
            isAdult: !!(isAdult === '1'),
            startYear: parseInt(startYear, 10),
            endYear: (endYear === '\N') ? null : parseInt(endYear, 10),
            runtimeMinutes: (runtimeMinutes === '\N') ? null : parseInt(runtimeMinutes, 10),
            genres: genres.split(','),
          };
          const result = (currentRecordIndex === 0) ? `[${JSON.stringify(parsedRow)}` : `,${JSON.stringify(parsedRow)}`;
          return result;
        });

        destination.on('finish', async () => {
          if (outputIndex === 0) {
            // In this case, no row has been processed from TSV file so the
            // output should be an empty list:
            await appendFile(outputPath, '[]', 'utf8');
          } else {
            // In this case, at least one row has been processed so we just need
            // to write the closing bracket:
            await appendFile(outputPath, ']', 'utf8');
          }
          resolve();
        });

        source.pipe(parser).pipe(transformer).pipe(destination);

      } catch (e) {
        reject(e);
      }
    },
  );

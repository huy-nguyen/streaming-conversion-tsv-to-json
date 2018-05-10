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
  ordering: string;
  nconst: string;
  category: string;
  job: string;
  characters: string;
}

interface Principal {
  nconst: string;
  category: string;
  job: string | null;
  characters: string[] | null;
}

interface ParsedRow {
  tconst: string;
  principals: Principal[];
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
          // Disable escaping so that unescaped double quotes within a column is preserved:
          escape: '',
        });

        let prevRow: RawRow | undefined;
        let outputIndex = 0;
        let inputRowIndex = 0;
        let outputObject!: ParsedRow;

        const transformer = transform((nextRow: RawRow) => {
          inputRowIndex += 1;
          if (inputRowIndex % 100000 === 0 && shouldLogProgress === true) {
            console.info('processing row ', inputRowIndex);
          }

          const {tconst, nconst, category, job, characters} = nextRow;

          let toBeReturned;
          if (
            // If this is the first row ...
              prevRow === undefined ||
            // ... or if the movie has changed ...
              nextRow.tconst !== prevRow.tconst) {

            // ... return previous movie;
            if (prevRow !== undefined) {
              toBeReturned = (outputIndex === 1) ?
                              `[${JSON.stringify(outputObject)}` : `,${JSON.stringify(outputObject)}`;
            }
            // ... then create a new movie:
            outputObject = {
              tconst,
              principals: [],
            };
            outputIndex += 1;
          }

          const {principals} = outputObject;
          let outputCharacters: string[] | null;
          if (characters === '\\N') {
            // This means `characters` is not provided:
            outputCharacters = null;
          } else if (characters.startsWith('[') && characters.endsWith(']')) {
            // `characters` should be interpreted as an array of strings:
            outputCharacters = JSON.parse(characters);
          } else {
            // If `characters` is a string, put it in a list:
            // (also need to remove quoted literal quotes surrounding the text):
            outputCharacters = [
              characters.replace(/^"/, '').replace(/"$/, ''),
            ];
          }
          principals.push({
            nconst,
            category,
            job: (job === '\\N') ? null : job,
            characters: outputCharacters,
          });

          prevRow = nextRow;

          if (toBeReturned !== undefined) {
            return toBeReturned;
          }
        });

        destination.on('finish', async () => {
          if (outputIndex === 0) {
            // In this case, no row has been processed from TSV file so the
            // output should be an empty list:
            await appendFile(outputPath, '[]', 'utf8');
          } else {
            // The last row would not have been written out to the file so
            // we need to do that here. However, we do need to open a new list (with ])
            // or continue an existing list (with a comma) depending on whether the last row
            // is alos the only row:
            const lastItemToWrite = (outputIndex === 1) ?
                                      `[${JSON.stringify(outputObject)}]` :
                                      `,${JSON.stringify(outputObject)}]`;
            await appendFile(outputPath, lastItemToWrite, 'utf8');
          }
          resolve();
        });

        source.pipe(parser).pipe(transformer).pipe(destination);

      } catch (e) {
        reject(e);
      }
    },
  );

import * as fs from 'fs';

export const fromFile = (file: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(data.toString());
    });
  });
};

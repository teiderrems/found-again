const path = require('path');
const prettierCommand = (filenames) =>
   `prettier ${filenames.map((f) => path.relative(process.cwd(), f)).join(' ')} --loglevel warn --write`;
const addProcessedFilesByPrettierCommand = (filenames) =>
   `git add ${filenames.map((f) => path.relative(process.cwd(), f)).join(' ')}`;

console.log(prettierCommand);

module.exports = {
   '*.{js,ts}': [
      //"ng lint",
      prettierCommand,
      addProcessedFilesByPrettierCommand,
   ],
};

const path = require('path');

// Helper to make paths relative
const getRelativePaths = (filenames) =>
   filenames.map((f) => path.relative(process.cwd(), f)).join(' ');

const prettierCommand = (filenames) =>
   `prettier ${getRelativePaths(filenames)} --loglevel warn --write`;

const eslintCommand = (filenames) => `eslint ${getRelativePaths(filenames)} --fix`;

const addProcessedFilesByPrettierCommand = (filenames) =>
   `git add ${getRelativePaths(filenames)}`;

// Remove this console.log - it's causing the unwanted output
// console.log(prettierCommand);

module.exports = {
   '*.{js,ts}': [eslintCommand, prettierCommand, addProcessedFilesByPrettierCommand],
};

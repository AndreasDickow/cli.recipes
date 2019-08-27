#!/usr/bin/env node

const program = require('commander');

// Require logic.js file and extract controller functions using JS destructuring assignment
const {getList, getTutorial, getMenu} = require('./logic');

  program
  .version('1.0.0').action(() => {
    getMenu();
  });




program.parse(process.argv);

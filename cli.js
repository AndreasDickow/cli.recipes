#!/usr/bin/env node

const record = require("./recorder").record;

const program = require('commander');
const version = require('./package.json').version;
// Require logic.js file and extract controller functions using JS destructuring assignment
const getMenu = require('./logic').getMenu;
const create = require('./logic').create;
const search = require('./logic').search;

const main = program
  .version(version) .description('Main command with subcommand');

  main.command('r').action(() => {
    console.log("record");
    record();
  });

  main.command('m').alias('start').action(() => {
    getMenu();
  });

    main.command('m').alias('search').action(() => {
    search();
  });

  main.command('c').action(() => {
    create();
  });




main.parse(process.argv);

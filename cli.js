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

  main.command('r').alias('record').action(() => {
    record();
  });

  main.command('m').alias('menu').action(() => {
    getMenu();
  });

    main.command('s').alias('search').action(() => {
    search();
  });

  main.command('c').alias('create').action(() => {
    create();
  });




main.parse(process.argv);

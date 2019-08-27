const program = require('commander');

// Require logic.js file and extract controller functions using JS destructuring assignment
const {getList, getTutorial, getMenu} = require('./logic');

program
  .version('1.0.0')
  .alias('start')
  .description('Terminal.guide').action(() => {
  getMenu();
});

program
  .command('getTutorial <name>')
  .alias('t')
  .description('get specific tutorial')
  .action((name) => {
    getTutorial({name});
  });

program
  .command('getList')
  .alias('l')
  .description('all tutorials')
  .action(() => {
    getList();
  });

program.parse(process.argv);

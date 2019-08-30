const create = require('./logic').create;
const getMenu = require('./logic').getMenu;
var fs = require('fs');
const storage = require('node-persist');

const cp = require('child_process')
const readline = require('readline');
var spawn = require('child_process').spawn;
var bash;

const record = async () => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});

  console.log("Starting a new recording session (quit by typing exit and press enter)" + "↵ ");


  var buffer = [];
  process.stdout.write('recorder$$$ ');
  const rl = readline.createInterface({
    input: process.stdin
  })

  function err(e) {
    console.error(e);
    process.stdout.write('recorder$$$ ');
  }

  rl.on('line', (command) => {
    (async () => {
      if (!bash) {

        bash = spawnInstance(buffer,rl)

      }
      const output = await bash(command);

      process.stdout.write(output)
      process.stdout.write('nrecorder$$$ ');
    })().catch(e => err(e));
  })

};


function spawnInstance(buffer,rl) {
  var c = cp.spawn('bash')
  c.on('close', function (code) {
    buffer.pop();//pop exit

//     //Here you can get the exit code of the script
//
//
//     if (code !== 0) {
//       // try exec if closed for another readson than finished
//       child.kill('SIGINT');
//       child = null;
//
//     } else {
//       child = null;
//     }
//     console.log(scriptOutput)
    var out = buffer.join('\n');
    fs.writeFile(".buffer.txt", out, (err) => {
  if (err) console.log(err);
  console.log("Successfully Written to template");
});

    rl.close();
    rl = null;
    c = null;
 console.log("saving buffer to template");
 console.log("to continue type \033[31mrecipes c\033[0m");

     //
//     //console.log('Full output of script: ',scriptOutput);
//   });
  });
  return command => {
    return new Promise((resolve, reject) => {
      var buf = Buffer.alloc(0)
      c.stdout.on('data', (d) => {
        buf = Buffer.concat([buf, d])
        if (buf.includes('ERRORCODE'))
          resolve(String(buf))
      })
      c.stderr.on('data', d => {
        buf = Buffer.concat([buf, d])
        reject(String(buf))
      })
         const number = buffer.length +1;
         buffer.push(`${number}. \`${command}\``);
      c.stdin.write(`${command} && echo ERRORCODE=$?\n`)
    })

  }
}


// Export all methods
module.exports = {record};

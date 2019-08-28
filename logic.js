//const https = require('https');
const https = require('http');
var fuzzy = require('fuzzy');

// Connect to a single MongoDB instance. The connection string could be that of a remote server
// We assign the connection instance to a constant to be used later in closing the connection
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const readline = require('readline');
const storage = require('node-persist');
var inquirer = require('inquirer');
var sys = require('sys')
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var child;
var host = 'localhost';
var port = 8000;

function SortByID(x, y) {
  return x.pk - y.pk;
}

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer()
});

// Converts value to lowercase


// curl \
//   -X POST \
//   -H "Content-Type: application/json" \
//   -d '{"username": "axyz", "password": "xxx"}' \
//   http://terminal.guide:8000/api/token/

function write(text) {
  var i = text.length;
  while (i--) {
    process.stdout.write(text.charAt(text.length - i - 1));
    wait(parseInt(Math.random() * 80));

  }
  process.stdout.write("\n\n");
}

function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

const getMenu = async () => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  var token = await storage.getItem("token");
  choices = ['browse', 'search', 'login', 'register', 'about'];

  if (token) {
    choices = ['my projects', 'browse', 'search', 'about', 'logout']

  } else {
    write('welcome to \x1b[36mterminal.guide\033[0m');

  }


  var questions = [
    // {
    //   type: 'input',
    //   name: 'phone',
    //   message: "What's your phone number?",
    //   validate: function (value) {
    //     var pass = value.match(
    //       /^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i
    //     );
    //     if (pass) {
    //       return true;
    //     }
    //
    //     return 'Please enter a valid phone number';
    //   }
    // },
    {
      type: 'list',
      name: 'tutorial.guide menu',
      choices: choices

    }
    // {
    //   type: 'input',
    //   name: 'quantity',
    //   message: 'How many do you need?',
    //   validate: function (value) {
    //     var valid = !isNaN(parseFloat(value));
    //     return valid || 'Please enter a number';
    //   },
    //   filter: Number
    // },
    // {
    //   type: 'expand',
    //   name: 'toppings',
    //   message: 'What about the toppings?',
    //   choices: [
    //     {
    //       key: 'p',
    //       name: 'Pepperoni and cheese',
    //       value: 'PepperoniCheese'
    //     },
    //     {
    //       key: 'a',
    //       name: 'All dressed',
    //       value: 'alldressed'
    //     },
    //     {
    //       key: 'w',
    //       name: 'Hawaiian',
    //       value: 'hawaiian'
    //     }
    //   ]
    // },
    // {
    //   type: 'rawlist',
    //   name: 'beverage',
    //   message: 'You also get a free 2L beverage',
    //   choices: ['Pepsi', '7up', 'Coke']
    // },
    // {
    //   type: 'input',
    //   name: 'comments',
    //   message: 'Any comments on your purchase experience?',
    //   default: 'Nope, all good!'
    // },
    //
    // {
    //   type: 'list',
    //   name: 'prize',
    //   message: 'For leaving a comment, you get a freebie',
    //   choices: ['cake', 'fries'],
    //   when: function (answers) {
    //     return answers.comments !== 'Nope, all good!';
    //   }
    // }
  ];

  inquirer.prompt(questions).then(answers => {

    var value = answers['tutorial']['guide menu'];

    if (!value) {
      getMenu();
    }

    if (value === 'login') {
      login();
      return true;
    } else if (value === 'register') {
      register();
      return true;
    } else if (value === 'logout') {
      logout();

      return true;
    } else if (value === 'browse') {
      getList(false);
      return true;
    } else if (value === 'my projects') {
      getList(true);
      return true;
    } else if (value === 'search') {
      search();
      return true;
    } else if (value === 'about') {
      const text = "\n\n\x1b[36mtutorial.guide\033[0m\nFast forward your installations\n" +
        "terminal.guide you through complex install procedures in the command line,\n" +
        "join the open source community and share your install procedures\n" +
        " or use those uploaded by others.\n" +
        "Visit us at https://tutorial.guide\nCopyright BIZ Factory, for legal info go to https://tutorial.guide/terms \n\n";
      write(text);


      getMenu();
      return true;
    }
  });
}
function confirmQuestion(input){
   var questions = [
    {
      type: 'confirm',
      name: 'tutorial.start',
      message: 'Start tutorial?',
      default: false
    }
  ];

  inquirer.prompt(questions).then(answers => {
    var confirm = answers['tutorial']['start'];
    if(confirm){
      getTutorial(input);
    }
    else{
      getMenu();
    }
  });

}

function askQuestion(query) {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();

    resolve(ans);
  }))
}

const login = async () => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  var username = await askQuestion("enter your \033[31m email \033[0m:" + "↵ ");
  var password = await askQuestion("enter your \033[31m password \033[0m:" + "↵ ");
  // Define search criteria. The search here is case-insensitive and inexact.
  const data = JSON.stringify({
    "username": username,
    "password": password
  });
  const options = {
    hostname: host,
    port: port,
    path: '/api/token/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  const req = https.request(options, (res) => {

    var body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', async function () {
      var parsed = JSON.parse(body);
      await storage.setItem('token', parsed);

      getMenu();

    });
  });

  req.on('error', (error) => {
    write(error)
  });
  req.write(data);
  req.end();

};

const refresh = async (mine) => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  // Define search criteria. The search here is case-insensitive and inexact.
  const auth = await storage.getItem('token');
  if (!auth || !auth['refresh']) {
    return logout();
  }
  const data = JSON.stringify({
    "refresh": auth["refresh"]
  });
  const options = {
    hostname: host,
    port: port,
    path: '/api/token/refresh/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  const req = https.request(options, (res) => {

    var body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', async function () {
      var parsed = JSON.parse(body);
      await storage.clear();
      await storage.setItem('token', parsed);

      getList(mine);

    });
  });

  req.on('error', (error) => {
    write("Your session is expired, please login again");
    logout();
  });

  req.write(data);
  req.end();

};

const logout = async () => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});

  await storage.clear();
  getMenu();

};


const register = async () => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  // Define search criteria. The search here is case-insensitive and inexact.

  var email = await askQuestion("enter your \033[31m email to register \033[0m:" + "↵ ");
  const data = JSON.stringify({
    "email": email
  });

  const options = {
    hostname: host,
    port: port,
    path: '/api/signup/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {

    var body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', async function () {
      try {
        var parsed = JSON.parse(body);
        if (!parsed["email"]) {
          write(body);
          return register();
        }


        write("please check your email account " + parsed["email"] + " to complete registration");
        write("Going to login");
        login();
      } catch (e) {
        write(e);
        return register();
      }
    });
  })

  req.on('error', (error) => {
    write(error);

  });

  req.write(data);
  req.end();

};


/**
 * @function  [addContact]
 * @returns {String} Status
 */
/**
 * @function  [getContact]
 * @returns {Json} contacts
 */

const getList = async (mine) => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  // Define search criteria. The search here is case-insensitive and inexact.
  const auth = await storage.getItem("token");
  if (!auth && mine) {
    write("your session expired, please login again")
    return login();
  }
  var url = mine === true ? '/tutorial/jsonapi/true/' : '/tutorial/jsonapi/false/';
  var headers = {}

  if (mine) {
    headers['Authorization'] = 'Bearer ' + auth['access']
  }
  var a = https.request({
    hostname: host,
    port: port,
    path: url,
    method: 'GET',
    headers: headers
  }, function (response) {
    // Continuously update stream with data
    var body = '';
    response.on('data', function (d) {
      body += d;
    });
    response.on('end', async function () {
      // Data received, let us parse it using JSON!
      var parsed = JSON.parse(body);
      parsed.sort(SortByID);
      for (var i = 0; i < parsed.length; i++) {
        console.log("\x1b[36m[" + parsed[i].pk + "]:" + parsed[i].fields.title + "\033[0m - " + parsed[i].fields.description);
      }
      write("\x1b[36mx\033[0m: back to menu");

      const answer = await askQuestion("enter Tutorial id to start with:");

      write(answer);

      if (answer === "x") {
        return getMenu();
      } else {
        return getTutorial(answer);
      }

    });

  })
  a.on('error', async (error) => {
    write(error);
    await refresh(mine);
  });
  a.end();
};



const searchApi = (answers, input) =>{

  return new Promise((resolve, reject) => {
    var a = https.request({
      hostname: host,
      port: port,
      path: '/tutorial/apisearch/?q=' + input,
      method: 'GET',
      headers: {}
    }, function (response) {
      // Continuously update stream with data
      var body = '';
      response.on('data', function (d) {
        body += d;
      });
      response.on('end', function () {
        // Data received, let us parse it using JSON!
        try {

          var parsed = JSON.parse(body);
          var results = []
          for (i = 0; i < parsed['results'].length; i++) {
            results[i] = "["+parsed['results'][i]['pk']+"] " + parsed['results'][i]['title']
          }
          var fuzzyResult = fuzzy.filter(input, results);
          resolve(
            fuzzyResult.map(function (el) {
              return el.original;
            })
          );
        }catch(e){
          var fuzzyResult = fuzzy.filter(input, []);
          resolve(
            fuzzyResult.map(function (el) {
              return el.original;
            })
          );
        }
      });

    })
    a.on('error', async (error) => {
      write(error);
      return reject(error);
    });
    a.end();
  });
};
function fuzzyTopics(answers, input) {
  input = input || '';
  return new Promise(function(resolve) {

      var fuzzyResult = fuzzy.filter(input, ["a","b"]);
      resolve(
        fuzzyResult.map(function(el) {
          return el.original;
        })
      );
  });
}


const search = async () => {
  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
  inquirer.prompt([{
    type: 'autocomplete',
    name: 'topic',
    message: 'Select a topic to search for',
    source: function (answersSoFar, input) {
      return searchApi(answersSoFar,input);
    }
  }]).then(function (answers) {
    confirmQuestion(answers['topic'].match(/\[([^)]+)\]/)[1])
  });
}


/**
 * @function  [getContact]
 * @returns {Json} contacts
 */
const getTutorial = async (name) => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  // Define search criteria. The search here is case-insensitive and inexact.
  if (!name) {
    name = await askQuestion("please enter search term :" + "↵ ");
  }
  const search = name.name ? name.name : name;
  const auth = await storage.getItem("token");

  https.get({
    hostname: host,
    port: port,
    path: '/tutorial/json/' + search + '/',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + auth['access']
    }
  }, function (response) {
    // Continuously update stream with data
    var body = '';
    response.on('data', function (d) {
      body += d;
    });
    response.on('end', async function () {
      if (!body) {
        write("\033[31mno recipe found\033[0m");
      } else {
        var parsed = JSON.parse(body);
        await askQuestion(parsed.title + " recipe ↵ ");
        const parts = parsed.text.split(/[0-9]+\.\s/);
        for (var i = 1; i < parts.length; i++) {
          if (parts[i] === "") {
            continue;
          }
          const command = parts[i].match(/\`(.*?)\`/);

          if (command[1] && command[1].length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            ans = await askQuestion(marked(parts[i]) + "default(\033[31m" + command[1] + "\033[0m):" + "↵ ");
            if (!ans) {
              ans = command[1];
            }
            //console.info(ans);
            // child = spawn(ans, async function (error, stdout, stderr) {
            //   child.stdin.write('\x1b[32m' + stdout+'\033[0m)\n');
            //   if (error !== null) {
            //     child.stdin.write('\033[31m' + stderr+'\033[0m)');
            //
            //     child.stdin.write('exec error: ' + error);
            //   }
            // });
            if (!child) {
              child = spawn("sh", ["-c", ans]);
              var scriptOutput = "";

              child.stdout.setEncoding('utf8');
              child.stdout.on('data', function (data) {
                //Here is where the output goes

                write('\n' + data);
                // setTimeout(function () {
                // }, 2000);
                data = data.toString();
                scriptOutput += data;
              });
              child.stdin.setEncoding('utf8');
              child.stdin.on('data', function (data) {
                //Here is where the output goes

                write('\n' + data);

                data = data.toString();
                scriptOutput += data;
              });

              child.stderr.setEncoding('utf8');
              child.stderr.on('data', function (data) {
                //Here is where the error output goes

                //console.log('stderr: ' + data);

                data = data.toString();
                scriptOutput += data;
              });

              child.on('close', function (code) {
                //Here you can get the exit code of the script


                if (code !== 0) {
                  // try exec if closed for another readson than finished
                  child.kill('SIGINT');
                  child = null;
                  res = exec(ans, function (error, stdout, stderr) {
                    console.log(stdout);
                  });
                } else {
                  child = null;
                }

                //console.log('Full output of script: ',scriptOutput);
              });


            } else if (child && child.stdin) {
              try {
                child.stdin.write(ans + "\n");
                if (ans == "exit") {

                  child.kill('SIGINT');
                  child = null;
                }
              } catch (e) {
                write(e);
                write(ans);
              }


              //  child.stdout.write(marked(parts[i]) + "default(\033[31m" + command[1] + "\033[0m):" + "↵");
              // child.stdin.write(ans);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));


            // child.stdin.write(marked(parts[i]) + "↵" + "\n")

          }
          // else {
          //   await askQuestion(marked(parts[i]) + "↵");
          //
          // }


        }
        write("\033[31mfinished\033[0m");
      }
      // Data received, let us parse it using JSON!


    });
  });


};

// Export all methods
module.exports = {getList, getTutorial, getMenu};

// const https = require('https');
const https = require('https');
var fuzzy = require('fuzzy');

const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const readline = require('readline');
const storage = require('node-persist');
var inquirer = require('inquirer');
var sys = require('sys')
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var child;

var port = 443;
var host = 'cli.recipes';


function SortByID(x, y) {
  return x.pk - y.pk;
}

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer()
});

function write(text, speed) {
  var i = text.length;
  while (i--) {
    process.stdout.write(text.charAt(text.length - i - 1));
    wait(parseInt(Math.random() * speed));

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
  if (token) {
    refresh(true)
  }
  choices = ['search', 'browse', 'login', 'register', 'about', 'switch to browser version'];

  if (token) {
    choices = ['my projects', 'search', 'create', 'browse', 'about', 'switch to browser version', 'logout']

  } else {
    write('welcome to \x1b[36mcli.recipes\033[0m', 80);

  }


  var questions = [

    {
      type: 'list',
      name: 'tutorial.recipe menu',
      choices: choices

    }

  ];

  inquirer.prompt(questions).then(async function (answers) {

    var value = answers['tutorial']['recipe menu'];

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
      await logout();
      getMenu();
      return true;
    } else if (value === 'create') {
      create();
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
      const text = "\n\n\x1b[36mtcli.recipes\033[0m\nFast forward your installations\n" +
        "cli.recipes you through complex install procedures in the command line,\n" +
        "join the open source community and share your install procedures\n" +
        " or use those uploaded by others.\n" +
        "Visit us at https://cli.recipes\nCopyright BIZ Factory, for legal info go to https://cli.recipes/terms \n\n";
      write(text, 10);


      getMenu();
      return true;
    } else if (value === 'switch to browser version') {
      var url = 'https://cli.recipes';
      var start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
      require('child_process').exec(start + ' ' + url);
      getMenu();
    }
  });
}


async function create() {
    await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  // Define search criteria. The search here is case-insensitive and inexact.
  const auth = await storage.getItem('token');
  if (!auth || !auth['refresh']) {
    console.log("please login and navigate to create to finish your record");
    return getMenu();
  }
  refresh(true);
  var guide = {
    "title": "",
    "link": "",
    "description": "",
    "text": "",
    "topic": []
  };
  var start = [
    {
      type: 'confirm',
      name: 'tutorial.create',
      message: 'Continue to create a new recipe',
      default: false
    }
  ]
  var questions = [
    {
      type: 'input',
      name: 'tutorial.title',
      message: "Enter a title for your recipe",
      validate: function (value) {
        if (value.length < 2) {
          return 'Enter at least 2 characters';
        } else if (value.length > 50) {
          return 'Your title should not be longer than 50 characters'
        }
        return true;

      }
    },
    {
      type: 'input',
      name: 'tutorial.link',
      message: "Add a link to your recipe",
      validate: function (value) {
        if (value) {
          const pattern = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;
          var pass = value.match(
            pattern
          );
          if (pass) {
            return true;
          }

          return 'Please enter a valid url';

        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'tutorial.description',
      message: "Describe your recipe",
      validate: function (value) {
        if (value.length < 10) {
          return 'Enter at least 10 characters in your description';
        } else if (value.length > 500) {
          return 'Your title should not be longer than 50 characters'
        }
        return true;
      }
    }
  ];
  inquirer.prompt(start).then(answers => {
    var confirm = answers['tutorial']['create'];
    if (confirm) {
      inquirer.prompt(questions).then(answers => {
        Object.keys(answers['tutorial']).forEach(k => {
          if(answers['tutorial'][k])
            guide[k] = answers['tutorial'][k];
        })

        addTopic((answers, guide) => {
          var vim = spawn('nano', ['.buffer.txt'], {stdio: 'inherit'});
          vim.on('exit', function () {
            fs.readFile(".buffer.txt", "utf8", function (error, data) {
              if (error) throw error;
              guide['text'] = data.toString();
              spawn("sh", ["-c", 'echo "1. my description `cli command default`\n2. next description `next cli command default`\n"> .buffer.txt']);
              guide['topic'] = answers;
              postTutorial(guide);
            });
          });
        }, [], guide);


      });

    } else {
      getMenu();
    }
  });
}


function confirmQuestion(input,callback,param) {
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
    if (confirm) {
      getTutorial(input);

    } else if(param){
      callback(param);
    }
    else{
      callback();
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
    write(error, 20)
  });
  req.write(data);
  req.end();

};

const postTutorial = async (guide) => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  // Define search criteria. The search here is case-insensitive and inexact.
  const auth = await storage.getItem('token');
  if (!auth || !auth['refresh']) {
    return logout();
  }
  // Define search criteria. The search here is case-insensitive and inexact.
  const data = JSON.stringify(guide);
  const options = {
    hostname: host,
    port: port,
    path: '/tutorial/create/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization':  'Bearer ' + auth['access']
    }
  };
  const req = https.request(options, (res) => {

    var body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {
      console.log(body);
      write("created");

      getMenu();

    });
  });

  req.on('error', (error) => {
    write(error, 20)
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


    });
  });

  req.on('error', async (error) => {
    write("Your session is expired, please login again", 80);
    await logout();
    getMenu();
  });

  req.write(data);
  req.end();

};

const logout = async () => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});

  await storage.clear();


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
          write(body, 80);
          return register();
        }


        write("please check your email account " + parsed["email"] + " to complete registration", 80);
        write("Going to login", 80);
        login();
      } catch (e) {
        write(e, 20);
        return register();
      }
    });
  })

  req.on('error', (error) => {
    write(error, 20);

  });

  req.write(data);
  req.end();

};


const getList = async (mine) => {
  await storage.init({expiredInterval: 14 * 24 * 60 * 60 * 1000});
  // Define search criteria. The search here is case-insensitive and inexact.
  const auth = await storage.getItem("token");
  if (!auth && mine) {
    write("your session expired, please login again", 80);
    return login();
  }
  var url = mine === true ? '/tutorial/jsonapi/true/' : '/tutorial/jsonapi/false/';
  var headers = {}

  if ( auth) {
    headers['Authorization'] = 'Bearer ' + auth['access']
  }
  var req = https.request({
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
      if(parsed.sort)
        parsed.sort(SortByID);
      choices = []
      choices.push("[x] back to menu");

      for (var i = 0; i < parsed.length; i++) {
        var forked = parsed[i].fields.origin > 0 ? "forked/" : "";
        choices.push("[" + parsed[i].pk + "]:\x1b[36m" + forked + parsed[i].fields.title + "\033[0m - " + parsed[i].fields.description + " (" + parsed[i].fields.calls + ")");
      }

      var questions = [
        {
          type: 'list',
          name: 'guide',
          choices: choices

        }
      ];

      inquirer.prompt(questions).then(answers => {

        result = answers['guide'].match(/\[([^)]+)\]/)[1];
        if (result === 'x') {
          getMenu();
        } else {
          confirmQuestion(result,getList,mine);
        }
      });

    });
  });
  req.on('error', async (error) => {
    write(error, 20);
    await refresh(mine);
    getList(mine);
  });
  req.end();
};


const searchApi = (answers, input) => {
  return new Promise((resolve, reject) => {
    var req = https.request({
      hostname: host,
      port: port,
      path: '/tutorial/apisearch/?q=' + encodeURI(input),
      method: 'GET',
      headers: {}
    }, function (response) {
      var body = '';
      response.on('data', function (d) {
        body += d;
      });
      response.on('end', function () {
        try {
          var parsed = JSON.parse(body);
          var results = []
          for (i = 0; i < parsed['results'].length; i++) {
            results[i] = "[" + parsed['results'][i]['pk'] + "] \x1b[36m" + parsed['results'][i]['title'] + "\033[0m (" + parsed['results'][i]['user'] + ")";
          }

          results[results.length] = '[x] back to Menu'
          resolve(results);
        } catch (e) {
          var fuzzyResult = fuzzy.filter(input, []);
          resolve(
            fuzzyResult.map(function (el) {
              return el.original;
            })
          );
        }
      });
    });
    req.on('error', async (error) => {
      write(error, 20);
      return reject(error);
    });
    req.end();
  });
};
const topicSearchApi = (answers, input) => {
  return new Promise((resolve, reject) => {
    var req = https.request({
      hostname: host,
      port: port,
      path: '/tutorial/apitopics/?q=' + encodeURI(input),
      method: 'GET',
      headers: {}
    }, function (response) {
      var body = '';
      response.on('data', function (d) {
        body += d;
      });
      response.on('end', function () {
        try {
          var parsed = JSON.parse(body);
          var results = []
          for (i = 0; i < parsed['results'].length; i++) {
            results[i] = "[" + parsed['results'][i]['pk'] + "] \x1b[36m" + parsed['results'][i]['title'] + "\033[0m ";
          }

          results[results.length] = '[done] continue to next to the tutorial content editor';
          resolve(results);
        } catch (e) {
          resolve(['[done] continue to next to the tutorial content editor']);
        }
      });
    });
    req.on('error', async (error) => {
      write(error, 20);
      return reject(error);
    });
    req.end();
  });
};

const addTopic = async (callback, answers, guide) => {

  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
  inquirer.prompt([{
    type: 'autocomplete',
    name: 'topic',
    message: 'Add some keywords',
    source: function (answersSoFar, input) {
      return topicSearchApi(answersSoFar, input);
    }
  }]).then(function (answer) {
    result = answer['topic'].match(/\[([^)]+)\]/)[1];
    if (result === 'done') {
      callback(answers, guide);
    } else {
      answers.push(parseInt(result));
      addTopic(callback, answers, guide);
    }
  });
}


const search = async () => {
  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
  inquirer.prompt([{
    type: 'autocomplete',
    name: 'topic',
    message: 'Select a topic to search for',
    source: function (answersSoFar, input) {
      return searchApi(answersSoFar, input);
    }
  }]).then(function (answers) {
    result = answers['topic'].match(/\[([^)]+)\]/)[1];
    if (result === 'x') {
      getMenu();
    } else {
      confirmQuestion(result,search,null);
    }
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
  var headers = {
    'Content-Type': 'application/json'
  }
  if (auth && auth['access']) {
    headers['Authorization'] = 'Bearer ' + auth['access']
  }

  https.get({
    hostname: host,
    port: port,
    path: '/tutorial/json/' + search + '/',
    headers: headers
  }, function (response) {
    // Continuously update stream with data
    var body = '';
    response.on('data', function (d) {
      body += d;
    });
    response.on('end', async function () {
      if (!body) {
        write("\033[31mno recipe found\033[0m", 80);
        getMenu();
      } else {
        var parsed = JSON.parse(body);
        await askQuestion(parsed.title + " recipe ↵ ");
        const parts = parsed.text.split(/[0-9]+\.\s/);
        for (var i = 1; i < parts.length; i++) {
          if (parts[i] === "") {
            continue;
          }
          const command = parts[i].match(/\`(.*?)\`/);

          await new Promise(resolve => setTimeout(resolve, 1000));
          var ans = null;
          console.log("");
          if (command && command[1] && command[1].length > 0) {

            ans = await askQuestion(marked(parts[i]) + "default(\033[31m" + command[1] + "\033[0m):" + "↵ ");
          }
          if (!ans) {
            ans = await askQuestion(marked(parts[i]) + ":" + "↵ ");
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

              process.stdout.write('\n' + data);
              // setTimeout(function () {
              // }, 2000);
              data = data.toString();
              scriptOutput += data;
            });
            // child.stdin.setEncoding('utf8');
            // child.stdin.on('data', function (data) {
            //   //Here is where the output goes
            //
            //   write('\n' + data, 10);
            //
            //   data = data.toString();
            //   scriptOutput += data;
            // });

            // child.stderr.setEncoding('utf8');
            // child.stderr.on('data', function (data) {
            //   //Here is where the error output goes
            //
            //   //console.log('stderr: ' + data);
            //
            //   data = data.toString();
            //   scriptOutput += data;
            // });

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
              write(e, 20);
              write(ans);
            }


            //  child.stdout.write(marked(parts[i]) + "default(\033[31m" + command[1] + "\033[0m):" + "↵");
            // child.stdin.write(ans);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));


          // child.stdin.write(marked(parts[i]) + "↵" + "\n")


        }
        write("\033[31mfinished\033[0m", 80);
        getMenu();
      }
      // Data received, let us parse it using JSON!


    });
  });


};

// Export all methods
module.exports = { getMenu,create};

/**
 * Module dependencies.
 */

// mongoose setup
require('./mongoose-db');
require('./typeorm-db')

var st = require('st');
var crypto = require('crypto');
var express = require('express');
var http = require('http');
var path = require('path');
var ejsEngine = require('ejs-locals');
var bodyParser = require('body-parser');
var session = require('express-session')
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var optional = require('optional');
var marked = require('marked');
var fileUpload = require('express-fileupload');
var dust = require('dustjs-linkedin');
var dustHelpers = require('dustjs-helpers');
var cons = require('consolidate');
const hbs = require('hbs')
const { exec } = require('child_process'); // Added for the vulnerable feature

var app = express();
var routes = require('./routes');
var routesUsers = require('./routes/users.js')

// all environments
app.set('port', process.env.PORT || 3001);
app.engine('ejs', ejsEngine);
app.engine('dust', cons.dust);
app.engine('hbs', hbs.__express);
cons.dust.helpers = dustHelpers;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(methodOverride());
app.use(session({
  secret: 'keyboard cat',
  name: 'connect.sid',
  cookie: { path: '/' }
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

// --- MODIFIED HOME PAGE ROUTE ---
// Original route app.get('/', routes.index); is replaced to provide a clear entry point for the demo.
app.get('/', (req, res) => {
    res.send(`
    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1>Welcome to the Demo App</h1>
        <p>This application includes several features.</p>
        <a href="/diagnostics" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Go to Network Diagnostic Tool
        </a>
        <p style="margin-top: 40px; color: #666;">(Other application routes like /login, /admin, etc., still exist.)</p>
    </div>
    `);
});


// --- NEW VULNERABLE FEATURE ADDED FOR DEMO ---
// A simple form for a "network diagnostic" tool
app.get('/diagnostics', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
      <h1>Network DNS Lookup</h1>
      <form action="/diagnostics" method="POST">
        <div style="margin-bottom: 10px;">
          <label for="domain">Domain to look up:</label>
          <input type="text" id="domain" name="domain" value="example.com" style="width: 300px; padding: 5px;">
        </div>
        <button type="submit">Run Lookup</button>
      </form>
      <div style="margin-top: 20px; text-align: left; background: #f0f0f0; padding: 15px; border-radius: 8px; width: 400px;">
        <h3>Try these inputs:</h3>
        <p><b>Normal:</b> <code>example.com</code></p>
        <p><b>Malicious:</b> <code>example.com; whoami</code></p>
        <p>On Linux/macOS, <code>whoami</code> will run. On Windows, try <code>example.com; dir</code>.</p>
      </div>
    </div>
  `);
});

// The vulnerable lookup endpoint
app.post('/diagnostics', (req, res) => {
  const domain = req.body.domain;

  // ######################################################################
  // ### VULNERABILITY HIGHLIGHTED HERE ###
  // ######################################################################
  //
  // The `exec` function from 'child_process' spawns a shell and executes commands within it.
  // Because the user-provided `domain` string is directly concatenated into the command,
  // an attacker can use shell metacharacters like ';' to append new, malicious commands.
  //
  // If a user enters `example.com; whoami`, the shell executes `nslookup example.com`
  // and THEN executes `whoami`, sending the output of both back to the user.
  // This allows an attacker to run arbitrary commands on your server.
  // Snyk and other static analysis tools should flag this line as a Command Injection flaw.
  //
  exec(`nslookup ${domain}`, (error, stdout, stderr) => {
    //
    // ######################################################################

    if (error) {
      return res.send(`<pre>Error:\n${error.message}</pre><a href="/diagnostics">Go back</a>`);
    }
    res.send(`<pre>Output:\n${stdout}${stderr}</pre><a href="/diagnostics">Go back</a>`);
  });
});
// --- END OF NEW VULNERABLE FEATURE ---


// Original Routes
app.use(routes.current_user);
// app.get('/', routes.index); // This was replaced above for the demo
app.get('/login', routes.login);
app.post('/login', routes.loginHandler);
app.get('/admin', routes.isLoggedIn, routes.admin);
app.get('/account_details', routes.isLoggedIn, routes.get_account_details);
app.post('/account_details', routes.isLoggedIn, routes.save_account_details);
app.get('/logout', routes.logout);
app.post('/create', routes.create);
app.get('/destroy/:id', routes.destroy);
app.get('/edit/:id', routes.edit);
app.post('/update/:id', routes.update);
app.post('/import', routes.import);
app.get('/about_new', routes.about_new);
app.get('/chat', routes.chat.get);
app.put('/chat', routes.chat.add);
app.delete('/chat', routes.chat.delete);
app.use('/users', routesUsers)

// Static
app.use(st({ path: './public', url: '/public' }));

// Add the option to output (sanitized!) markdown
marked.setOptions({ sanitize: true });
app.locals.marked = marked;

// development only
if (app.get('env') == 'development') {
  app.use(errorHandler());
}

var token = 'SECRET_TOKEN_f8ed84e8f41e4146403dd4a6bbcea5e418d23a9';
console.log('token: ' + token);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

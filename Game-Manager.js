var express 	= require('express');
var path 		= require('path');
var bodyParser 	= require('body-parser');
var crypto 		= require('crypto');
var fs			= require('fs');
var passport	= require('passport');
var Strategy 	= require('passport-local').Strategy;
var multer 		= require('multer');


// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
function(username, password, done) {
	
	fs.readFile('administrators.json', 'utf8', function (err,fd) {
	  if (err) {
		return done(null, false);
	  }
	  
	  var administrators = JSON.parse(fd);
	  var sha512 = crypto.createHash('sha512');
	  sha512.update(password);
	  var hashedPassword = sha512.digest("hex")
	  
	  var user;
	  
	  for(var i = 0; i < administrators.length; i++) {		  
		  if(administrators[i].username == username && administrators[i].password == hashedPassword) {
			  user = administrators[i];
			  break;
		  }
	  }

	  if(user)
		return done(null, user);
	  else
		return done(null, false);	  
	});
}));
  
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, done) {
	done(null, user.username);
});

passport.deserializeUser(function(username, done) {
	fs.readFile('administrators.json', 'utf8', function (err,data) {
	  if (err) {
		return done(err);
	  }
	  
	  var administrators = JSON.parse(data);	  
	  var user;
	  
	  for(var i = 0; i < administrators.length; i++) {		  
		  if(administrators[i].username == username) {
			  user = administrators[i];
			  break;
		  }
	  }

	  if(user)
		 done(null, user);
	  else
		 done(null);	  
	});
});

var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
var upload = multer({dest: "./uploads/"});
app.use(require('express-session')({ secret: 'therecanonlybeonehighlander', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session()); 


app.get('/', function(req, res) {
	
	if (req.isAuthenticated && req.isAuthenticated()) {
		res.redirect('dashboard');
	} else {
		// Check if administrator account has already been made 
		fs.exists('administrators.json', function(exists) {
			if (exists) {
				// TODO: Authenticate the user
				res.render("pages/login");
			}
			else {
				// Send the user to the setup page
				res.render('pages/setup');
			}
		});
	}
});

app.get('/setup', function(req, res) {
	
	if (req.isAuthenticated && req.isAuthenticated()) {
		res.redirect('dashboard');
	} else {
		// Check if administrator account has already been made 
		fs.exists('administrators.json', function(exists) {
			if (exists) {
				// TODO: Authenticate the user
				res.render("pages/login");
			}
			else {
				// Send the user to the setup page
				res.render('pages/setup');
			}
		});
	}
});

app.post('/setup', function(req, res) {
	
	// Check if administrator account has already been made 
	fs.exists('administrators.json', function(exists) {
		if (!exists) {
			
			// TODO: Make sure these variables are not undefined/null form the form (brute forced post, test with postman)
			var username = req.body.username;
			var password = req.body.password;
			var repeatPassword = req.body.repeat_password;
			
			if(username.length >= 6 && password.length >= 8 && password == repeatPassword) {				
				var sha512 = crypto.createHash('sha512');
				sha512.update(password);
				var hashedPassword = sha512.digest("hex")
				
				var buffer = new Buffer("[{ \"username\": \"" + username + "\", \"password\": \"" + hashedPassword + "\"}]");
				
				fs.open('administrators.json', 'w', function(err, fd) {
					fs.write(fd, buffer, 0, buffer.length, null, function(err) {
						if (err) throw 'error writing file: ' + err;
						fs.close(fd, function() {
							res.redirect("login");
						})
					});
				});
			}
			else {
				var errors = [];
				
				if(username.length < 6)
					errors.push("Username is too short. Username must be at least 6 characters."); 
				if(password.length < 8)
					errors.push("Password is too short. Password must be at least 8 characters."); 
				if(password != repeatPassword)
					errors.push("Passwords don't match."); 
				
				res.render('pages/setup', { errors: errors });
			}
		}
		else {
			res.redirect("/");
		}
	});	
});

app.get('/login', function(req, res) {
	
	if (req.isAuthenticated && req.isAuthenticated()) {
		res.redirect('dashboard');
	} else {
		res.render('pages/login');
	}
});

app.post('/login', passport.authenticate('local', { successRedirect: '/dashboard', failureRedirect: '/login' }));

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
}); 

app.get('/dashboard', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
	
	var servers = [];
	
	// Get All Server Instances to display
	fs.readdir('servers/',function(err, files) {
		if (err) {
			return console.error(err);
		}
		
		for(var i = 0; i < files.length; i++) {
			var server = fs.readFileSync('servers/' + files[i]).toString();
			if(server) {
				var json = JSON.parse(server);
				servers.push(json);
			}
		}
	   
	    res.render('pages/dashboard', {"servers": servers});
	});	
});

app.get('/add-server', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {

	var games = JSON.parse(fs.readFileSync('install/games.json').toString());
	res.render('pages/add-server', {games: games});
});

app.get('/add-server/:game', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
		
	var game = req.params.game;
	res.render('pages/add-server/'+ game);
});

app.post('/add-server/:game', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
		
	var game = req.params.game;
	
	if (req.files) {
		console.log(util.inspect(req.files));
		if (req.files.server_tarball.size === 0) {
			return next(new Error("Hey, first would you select a file?"));
		}
		fs.exists(req.files.server_tarball.path, function(exists) {
			if(exists) {
				res.end("Got your file!");
			} else {
				res.end("Well, there is no magic for those who don’t believe in it!");
			}
		});
	}
	
	// TODO: Check for this file existing. Display error if it doesn't
	var install = require('./install/' + req.body.game);
	if(install.verify(req.body)) {
		install.start(req.body);
	} else {
		// TODO: Show error about validation and return to form page
	}
	res.redirect("dashboard");	
});

app.get('/server/:game/:instance', require('connect-ensure-login').ensureLoggedIn(),function(req, res) {
	
	var game = req.params.game;
	var instance = req.params.instance;
	
	var json = JSON.parse(fs.readFileSync('servers/' + game + '.json').toString());
	res.render('pages/server/' + game, {instance: json});
});

app.use('/css', express.static(path.join(__dirname, '/css')));
app.use('/js', express.static(path.join(__dirname, '/js')));
app.use('/img', express.static(path.join(__dirname, '/img')));

app.listen(8080, function () {
  console.log('Game Manager Started');
});

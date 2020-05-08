//jshint esversion:6

//importing environment variables
require('dotenv').config();

//importing external modules
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');



//starting server
const app = express();
app.listen(process.env.PORT, () => console.log('Server up and running'));

//binding required middlewares
app.use(express.urlencoded({
  extended: false
}));
app.use(express.static('public'));

//define app settings
app.set('view engine', 'ejs');

//session setup
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());

//database setup
mongoose.connect('mongodb://localhost:27017/usersDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

//schema creation
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

//inserting plugin to hash and salt registrations
userSchema.plugin(passportLocalMongoose);

//method for Google authentication with OAuth
userSchema.plugin(findOrCreate);

//model to manage a 'users' collection
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//Google Login Strategy setup
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

//Facebook login strategy setup
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

//root route
app.route('/')

  .get((req, res) => {
    res.render('home');
  })

  .post((req, res) => {
    res.send('Hello POST');
  });


//register route
app.route('/register')

  .get((req, res) => {
    res.render('register');
  })

  .post((req, res) => {
    User.register({
      username: req.body.username
    }, req.body.password, (err, user) => {
      if (err) {
        res.write(err.message);
        res.redirect('/register');
      } else {
        passport.authenticate('local')(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });
  });


//login route
app.route('/login')
  .get((req, res) => {
    res.render('login');
  })

  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate('local')(req, res, function() {
          res.redirect('/secrets');
        });
      }
    });


  });



//submit route
app.get('/submit', (req, res) => {
  res.render('submit');
});


//secrets route
app.get('/secrets', (req, res) => {

  User.find({'secret': {$ne:null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    } else {
      if(foundUsers){ 
        res.render('secrets', {usersWithSecrets: foundUsers});
      }
    }

  });
});

//logout route

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


//Google authentication route

app.get('/auth/google',
  //this line brings the Google login page
  passport.authenticate('google', {
    scope: ['profile']
  })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect to the secrets page
    res.redirect('/secrets');
  });


//Facebook authentication route
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//user clicks on "Submit a Secret"
app.get('/submit', (req, res) => {
      if (req.isAuthenticated()) {
        res.render('submit');
      } else {
        res.redirect('/login');
      }

      });

    app.post('/submit', (req, res) => {
      const submittedSecret = req.body.secret;
      User.findById(req.user.id, function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.secret = submittedSecret;
            foundUser.save(() => {
              res.redirect('/secrets');
            });
          }
        }
      });
    });

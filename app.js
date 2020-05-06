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
  password: String
});

//inserting plugin to hash and salt registrations
userSchema.plugin(passportLocalMongoose);

//model to manage a 'users' collection
const User = mongoose.model('User', userSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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
    req.login(user, function(err){
      console.log('entrou no login');
      if(err){
        console.log(err);
      } else {
        passport.authenticate('local')(req, res, function(){
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
  //check if user is logged in before rendering the page
  if (req.isAuthenticated()) {
    res.render('secrets');
  } else {
    res.redirect('/login');
  }
});

//logout route
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

//jshint esversion:6

//importing environment variables
require('dotenv').config();

//importing external modules
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

//starting server
const app = express();
const port = 3000;
app.listen(port, () => console.log('Server up and running') );

//binding required middlewares
app.use(express.urlencoded({extended: false}));
app.use(express.static('public'));

//define app settings
app.set('view engine', 'ejs');

//database setup
mongoose.connect('mongodb://localhost:27017/usersDB', {useNewUrlParser: true, useUnifiedTopology: true});

//schema creation
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//adding encryption to the Schema
userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ['password']
});

//model to manage a 'users' collection
const User = mongoose.model('User', userSchema);



//root route
app.route('/')

  .get( (req, res) => {
    res.render('home');
  })

  .post( (req, res) => {
    res.send('Hello POST');
  });

//login route
app.route('/login')

.get( (req, res) => {
  res.render('login');
})

.post( (req, res) => {
  User.findOne({email: req.body.email}, (err, userFound) => {
    if(err){
      console.log(err);
    } else {
      if(userFound){
        if(userFound.password === req.body.password){
          res.render('secrets');
        }
      }
    }
  });
});

//register route
app.route('/register')

.get( (req, res) => {
  res.render('register');
})

.post( (req, res) => {

  const newUser = new User({
    email: req.body.email,
    password: req.body.password
  });
  newUser.save( (err) => {
    if(err){
      console.log(err);
    } else {
      res.render('secrets');
    }
  });

});

//submit route
app.get('/submit', (req, res) => {
  res.render('submit');
});

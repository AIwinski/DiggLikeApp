const express = require('express');
const router = express.Router();
const Joi = require('joi');
const passport = require('passport');
const randomstring = require('randomstring');
const mailer = require('../misc/mailer');

const User = require('../models/user');

// Validation Schema
const userSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  confirmationPassword: Joi.any().valid(Joi.ref('password')).required()
});

// Authorization 
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('error', 'Musisz się najpierw zarejestrować');
    res.redirect('/');
  }
};

const isNotAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.flash('error', 'Jestes już zalogowany!');
    res.redirect('/');
  } else {
    return next();
  }
};

router.route('/register')
  .get(isNotAuthenticated, (req, res) => {
    res.render('register');
  })
  .post(async (req, res, next) => {
    try {
      const result = Joi.validate(req.body, userSchema);
      if (result.error) {
        req.flash('error', 'Niepoprawne dane!');
        res.redirect('/users/register');
        return;
      }
      result.value.email = result.value.email.toLowerCase();

      // Checking if email is already taken
      const user = await User.findOne({ 'email': result.value.email });
      if (user) {
        req.flash('error', 'Podany email jest już zajęty!');
        res.redirect('/users/register');
        return;
      }

      // Hash the password
      const hash = await User.hashPassword(result.value.password);

      // Generate secret token
      const secretToken = randomstring.generate();
      console.log('secretToken', secretToken);

      // Save secret token to the DB
      result.value.secretToken = secretToken;

      // Flag account as inactive
      result.value.active = false;

      // Save user to DB
      delete result.value.confirmationPassword;
      result.value.password = hash;

      const newUser = await new User(result.value); 
      console.log('newUser', newUser);
      await newUser.save();

      // Compose email
      const html = `Witaj,
      <br/>
      Dziękujemy za rejestrację w naszym serwisie!
      <br/><br/>
      Dokończ rejestrację klikając w poniższy link:
      <br/>
      <a href="https://aqueous-forest-41074.herokuapp.com/users/verify/${secretToken}">https://aqueous-forest-41074.herokuapp.com/users/verify/${secretToken}</a>
      <br/><br/>
      Miłego korzystania z serwisu!` 

      // Send email
      await mailer.sendEmail('admin@aplikacja.com', result.value.email, 'Dokończ rejestrację', html);

      req.flash('success', 'Dokończ rejestrację klikając w link który wysłaliśmy Ci na maila.');
      res.redirect('/users/login');
    } catch(error) {
      next(error);
    }
  });

router.route('/login')
  .get(isNotAuthenticated, (req, res) => {
    res.render('login');
  })
  .post(passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  }));



// router.route('/verify/:token')
//   .get(isNotAuthenticated, (req, res) => {
//     try {
//       const { secretToken } = req.params.token;

//       // Find account with matching secret token
//       const user = User.findOne({ 'secretToken': secretToken });
//       if (!user) {
//         req.flash('error', 'Błąd! Nie znaleziono użytkownika.');
//         res.redirect('back');
//         return;
//       }

//       user.active = true;
//       user.secretToken = '';
//       user.save();

//       req.flash('success', 'Konto aktywne! Możesz się zalogować.');
//       res.redirect('/users/login');
//     } catch(error) {
//       next(error);
//     }
//   });

router.get("/verify/:token", function(req, res){
    User.findOne({secretToken: req.params.token}, function(err, user){
        console.log("=1=");
        if(err){
          console.log("=2=");
          console.log(err);
          req.flash('error', 'Błąd! Nie znaleziono użytkownika.');
          res.redirect("/");
        } else {
            if(user){
              console.log("=3=");
              user.active = true;
              user.secretToken = "";
              user.save();
              req.flash('success', 'Konto aktywne! Możesz się zalogować.');
              res.redirect('/users/login');
            } else {
              console.log("=4=");
              req.flash('error', 'Błąd! Niepoprawna weryfikacja email!');
              res.redirect('/users/register');
            }
        }
    });
});

router.route('/logout')
  .get(isAuthenticated, (req, res) => {
    req.logout();
    req.flash('success', 'Wylogowano pomyślnie');
    res.redirect('/');
  });

module.exports = router;
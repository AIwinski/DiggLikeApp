const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch(error) {
        done(error, null);
    }
});

passport.use('local', new LocalStrategy({  
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false
}, async (email, password, done) => {
    try {
        // 1) Check if the email already exists
        const user = await User.findOne({ 'email': email });
        if (!user) {
            return done(null, false, { message: 'Nieznany użytkownik' });
        }

        // 2) Check if the password is correct
        const isValid = User.comparePasswords(password, user.password);
        if (!isValid) {
            return done(null, false, { message: 'Złe hasło!' });
        }

        // 3) Check if email has been verified
        if (!user.active) {
            return done(null, false, { message: 'Musisz dokończyć rejestracje poprzez kliknięcie w link wysłany na Twojego maila.' });
        }

        return done(null, user);
    } catch(error) {
        return done(error, false);
    }
}));
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    email: String,
    secretToken: String,
    active: Boolean,
    username: String,
    password: String,
    isAdmin: {type: Boolean, default: false},
    image: {type: String, default: "http://www.thechefpost.com/uploads/profilepic/default.png"}    
});

const User = mongoose.model('user', userSchema);
module.exports = User;
module.exports.hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch(error) {
        throw new Error('Hashing failed', error);
    }
};
module.exports.comparePasswords = (inputPassword, hashedPassword) => {
    //console.log("poownanie hasel");
    try {
        return bcrypt.compareSync(inputPassword, hashedPassword);
    } catch(error) {
        throw new Error('Comparing failed', error);
    }
};
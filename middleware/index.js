var Comment = require("../models/comment");
var Post = require("../models/post");
var bcrypt = require('bcryptjs');
var User = require("../models/user");

var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that"); 
	res.redirect("/login");
}

// middlewareObj.checkBlogOwnership = function(req, res, next){ 
// 	//is user logged in?
// 	if (req.isAuthenticated()) {
// 		Blog.findById(req.params.blogId, function(err, foundBlog){
// 			if(err) {
// 				req.flash("error", "Blog not found");
// 				res.redirect("back");
// 			} else {
// 				//does the user own the blog?
// 				if (foundBlog.author.id.equals(req.user._id)) { 
// 					next();
// 				} else {
// 					req.flash("error", "You dont have permission to do that");
// 					res.redirect("back"); //tak sie robi redirecta wstecz
// 				}
				
// 			}
// 		});
// 	} else {
// 		req.flash("error", "You have to be logged to do that");
// 		res.redirect("back");
// 	}
 
// }

middlewareObj.checkCommentOwnership = function(req, res, next){ //sprawdza czy zalogowany i czy jego campground
	//is user logged in?
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err) {
				req.flash("error", "Something went wrong");
				res.redirect("back");
			} else {
				//does the user own the comment?
				if (foundComment.author.id.equals(req.user._id)) { //tu musi byc equals bo jedno to jest string a drugie to jest objekt mongoose
					next();
				} else {
					req.flash("error", "You dont have permission to do that");
					res.redirect("back"); //tak sie robi redirecta wstecz
				}
				
			}
		});
	} else {
		req.flash("error", "You have to be logged in to do that");
		res.redirect("back");
	}
 
}

middlewareObj.checkPostOwnership = function(req, res, next){ //sprawdza czy zalogowany i czy jego campground
	//is user logged in?
	if (req.isAuthenticated()) {
		Post.findById(req.params.comment_id, function(err, foundComment){
			if(err) {
				req.flash("error", "Something went wrong");
				res.redirect("back");
			} else {
				//does the user own the comment?
				if (foundPost.author.id.equals(req.user._id)) { //tu musi byc equals bo jedno to jest string a drugie to jest objekt mongoose
					next();
				} else {
					req.flash("error", "You dont have permission to do that");
					res.redirect("back"); //tak sie robi redirecta wstecz
				}
				
			}
		});
	} else {
		req.flash("error", "You have to be logged in to do that");
		res.redirect("back");
	}
 
}

// sync version of hashing function
middlewareObj.myHasher = function(password, tempUserData, insertTempUser, callback) {
    var hash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    return insertTempUser(hash, tempUserData, callback);
};

// async version of hashing function
middlewareObj.myHasher = function(password, tempUserData, insertTempUser, callback) {
    bcrypt.genSalt(8, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            return insertTempUser(hash, tempUserData, callback);
        });
    });
};

middlewareObj.comfigureEmailSend = function(){
	nev.configure({
		    verificationURL: 'http://myawesomewebsite.com/email-verification/${URL}',
		    persistentUserModel: User,
		    tempUserCollection: 'myawesomewebsite_tempusers',

		    transportOptions: {
		        service: 'Gmail',
		        auth: {
		            user: 'myawesomeemail@gmail.com',
		            pass: 'mysupersecretpassword'
		        }
		    },
		    verifyMailOptions: {
		        from: 'Do Not Reply <myawesomeemail_do_not_reply@gmail.com>',
		        subject: 'Please confirm account',
		        html: 'Click the following link to confirm your account:</p><p>${URL}</p>',
		        text: 'Please confirm your account by clicking the following link: ${URL}'
		    }
		}, function(error, options){
	});
}




module.exports = middlewareObj;
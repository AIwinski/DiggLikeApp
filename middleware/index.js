var Comment = require("../models/comment");
var Post = require("../models/post");
var bcrypt = require('bcryptjs');
var User = require("../models/user");

var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Musisz się najpierw zalogować!"); 
	res.redirect("/users/login");
}


middlewareObj.checkCommentOwnership = function(req, res, next){ //sprawdza czy zalogowany i czy jego comment
	//is user logged in?
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err) {
				req.flash("error", "Something went wrong");
				res.redirect("back");
			} else {
				if(req.user.isAdmin == true){
					next();
				}
				//does the user own the comment?
				else if (foundComment.author.id.equals(req.user._id)) { //tu musi byc equals bo jedno to jest string a drugie to jest objekt mongoose
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

middlewareObj.checkPostOwnership = function(req, res, next){ //sprawdza czy zalogowany i czy jego post
	//is user logged in?
	if (req.isAuthenticated()) {
		Post.findById(req.params.postId, function(err, foundPost){
			if(err) {
				req.flash("error", "Nie znaleziono posta!");
				res.redirect("/");
			} else {
				if(foundPost === null){
					req.flash("error", "Nie znaleziono posta!");
					res.redirect("/");
				}
				if(req.user.isAdmin == true){
					next();
				}
				else if (foundPost.author.id.equals(req.user._id)) { //tu musi byc equals bo jedno to jest string a drugie to jest objekt mongoose
					next();
				} else {
					req.flash("error", "Nie masz do tego uprawnień!");
					res.redirect("back"); //tak sie robi redirecta wstecz
				}
				
			}
		});
	} else {
		req.flash("error", "Musisz sie najpierw zalogować!");
		res.redirect("back");
	}
 
}

module.exports = middlewareObj;
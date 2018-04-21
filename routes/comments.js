var express = require("express");
var app = express();
var router = express.Router();
var Post = require("../models/post");
var Comment = require("../models/comment");
var middleware = require("../middleware/index");

// router.post("/:id", middleware.isLoggedIn, function(req, res){
	
// 	//console.log("dodawanie komentarza")
// 	var id = req.params.id;
// 	var comment = req.body.comment;
// 	var newComment = {
// 		text: comment,
// 		date: Date.now(),
// 		points: 0,
// 		author: {
// 			id: req.user._id,
// 			username: req.user.username
// 		}
// 	}

// 	Post.findOne({"_id": id}, function(err, foundPost){
// 		if(err){
// 			console.log(err);
// 		} else {
// 			Comment.create(newComment, function(err, newlyCreated){
// 				if(err){
// 					console.log(err);
// 					req.flash("error", "Nie udalo sie dodac komentarza");
// 					res.redirect("back");
// 				} else {
// 					foundPost.comments.push(newlyCreated);
// 					foundPost.save();
// 					res.status(200);
// 					res.setHeader("Content-type", "text/json")
// 					console.log("koniec dodawania")
// 					return res.send({success: true});
// 				}
// 			});
// 		}
// 	});
// });









module.exports = router;

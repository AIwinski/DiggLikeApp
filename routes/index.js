var express = require("express");
var app = express();
var router = express.Router();
var Post = require("../models/post");

var categories = require("../config/categories");

var numberOfPostsOnPage = 7; //podzielne przez 3 + 1

router.get("/about", function(req, res){
	render("about");
});

router.get("/back", function(req, res){
	backURL=req.header('Referer') || '/';
  	res.redirect(backURL);
})

router.get("/", function(req, res){
	Post.find({}, function(err, foundPosts){
		if(err){
			console.log(err);
			res.send("Database error");
		} else {
			foundPosts.sort(compareDates);
			foundPosts.sort(comparePoints);
			foundPosts = foundPosts.slice(0, numberOfPostsOnPage);
			res.render("landing", {posts: foundPosts, categories: categories, category: "all"});
		}
	});
    
});

// function isLoggedIn(req, res, next){
// 	if(req.isAuthenticated()){
// 		return next();
// 	}
// 	res.redirect("/login");
// }

function comparePoints(a,b) {
  if (a.points < b.points)
    return 1;
  if (a.points > b.points)
    return -1;
  return 0;
}

function compareDates(a,b) {
  if (a.date.getTime() > b.date.getTime())
    return -1;
  if (a.date.getTime() < b.date.getTime())
    return 1;
  return 0;
}





module.exports = router;
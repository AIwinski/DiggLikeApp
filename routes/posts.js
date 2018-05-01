var express = require("express");
var app = express();
var router = express.Router();
var middleware = require("../middleware/index");
var Post = require("../models/post");
var User = require("../models/user");
var Comment = require("../models/comment");
var scrapeit = require("scrape-it");


var Scraper = require('../middleware/scraper');

var categories = require("../config/categories");

var numberOfPostsOnPage = 4;//podzielne przez 3 + 1

router.get("/", function(req, res){
	res.redirect("/");
});

router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("posts/new");
});





router.post("/", middleware.isLoggedIn, function(req, res){
	var newPost = {
		title: req.body.title,
		description: req.body.description,
		image: req.body.image,
		author: {
			id: req.user._id,
			username: req.user.username
		}, 
		category: req.body.category.toLowerCase(),
		date: Date.now(),
		link: req.body.link
	}
	Post.create(newPost, function(err, newlCreated){
		if(err){
			console.log(err);
			req.flash("error", "Wystąpił błąd podczas tworzenia nowego posta!");
			res.redirect("/");
		} else {
			req.flash("success", "Pomyślnie dodano nowy post!");
			res.redirect("/");
		}
	})
});

router.delete("/:postId", middleware.checkPostOwnership, function(req, res){
	var id = req.params.postId;
	Post.findByIdAndRemove(id, function(err){
		if(err){
			console.log(err);
			req.flash("error", "Wystąpił błąd");
			res.redirect("/");
		} else {
			req.flash("success", "Pomyślnie usunięto post");
			res.redirect("/");
		}
	});
});

router.put("/:postId", middleware.checkPostOwnership, function(req, res){
	var id = req.params.postId;
	var post = {
		title: req.body.title,
		description: req.body.description,
		image: req.body.image,
		category: req.body.category.toLowerCase(),
		date: Date.now(),
		link: req.body.link
	} 
	Post.findByIdAndUpdate(id, post ,function(err, updatedPost){
		if(err){
			console.log(err);
			req.flash("error", "Wystąpił błąd");
			res.redirect("/");
		} else {

		}
	});
});

router.post("/adddetails", /*middleware.isLoggedIn,*/ function(req, res){
	var title;
	var desc;

	var link = req.body.link.toString();
	console.log(link);
	link.replace(/\s/g, "");
	if(!link || link.length===0){
		res.render("posts/wrongLink");
	}

	scrapeit(link, {
	    title: {
	    	selector: "article h1",
	    	textteq: 1
	    },
	    desc: {
	    	selector: "article p",
	    	textteq: 1
	    }
	}).then(({ data, response }) => {
	    title = data.title.substring(0, 150).replace(/(\r\n\t|\n|\r\t)/gm, "");
	    desc = data.desc.substring(0, 500).replace(/(\r\n\t|\n|\r\t)/gm, "");

	    var scraper = new Scraper(link);
	 	var images = [];
	  	scraper.scrape(function(image) {
	     	images.push(image.address);
	    }, function(){
	      var uniqueImages = images.filter(function(item, pos) {
	          return images.indexOf(item) == pos;
	      })
	      console.log(title  + " " + desc);
	      res.render("posts/new2", {images: uniqueImages, link: link, title: title, desc: desc});
	    }, function(){
	      res.render("posts/wrongLink");
	    });
	});
});

router.post("/find", function(req, res){
	var toFind = req.body.toFind.toLowerCase();
	var results = [];
	var pages = {
		all: 1,
		curr: 1
	}
	Post.find({}, function(err, foundPosts){
		if(err){
			console.log(err);
			res.redirect("/");
			//res.render("posts/index", {posts: results, categories: categories, category: "all"});
		} else {
			foundPosts.forEach(function(post){
				if(post.title.toLowerCase().includes(toFind) || post.description.toLowerCase().includes(toFind) || post.link.toLowerCase().includes(toFind)){
					results.push(post);
				}
			});
			results.sort(compareDates);
			res.render("posts/index", {posts: results, categories: categories, category: "all", pages: pages});
		}
	});
});

router.get("/edit/:id", function(req, res){
	res.send("edit")
});

router.post("/fav", middleware.isLoggedIn, function(req, res){
	var id = req.body.id;
	var userId = req.user._id;
	Post.findOne({"_id": id}, function(err, foundPost){
		if(err){
			console.log("blad");
			res.send({success: false});
		} else {
			var valid = false;
			var pos = 0;
			for(var i=0;i<foundPost.fav.length;i++){
				if(foundPost.fav[i].equals(req.user._id)){
					valid = true;
					pos = i;
				}
			}
			if(valid){
				foundPost.fav.splice(pos);
			} else {
				foundPost.fav.push(req.user._id);
			}
			foundPost.save();
			res.send({success: true});
		}
	});
});

router.get("/fav", middleware.isLoggedIn, function(req, res){
	var pages = {
		all: 1,
		curr: 1
	}
	Post.find({}, function(err, posts){
		if(err){
			console.log(err);
			req.flash("error", "Wystąpił błąd");
			res.redirect("/");
		} else {
			var results = [];
			posts.forEach(function(post){
				for(var i=0;i<post.fav.length; i++){
					if(post.fav[i].equals(req.user._id)){
						results.push(post);
					}
				}
			});
			results.sort(compareDates);
			res.render("posts/index", {posts: results, category: "Ulubione", categories: categories, pages: pages});
		}
	});
});



router.post("/vote/:id/:status", middleware.isLoggedIn ,function(req, res){
	var postId = req.body.id;
	var status = req.params.status;
	Post.findOne({"_id": postId}, function(err, foundPost){
		if(err){
			console.log(err);
			req.flash("error", "Nie znaleziono posta!");
			res.redirect("/");
		} else {
			var existsUp = false;
			var posUp = 0;
			for(var i=0;i<foundPost.upvoters.length;i++){
				if(foundPost.upvoters[i].equals(req.user._id)){
					existsUp = true;
					posUp = i;
					break;
				}
			}
			var existsDown = false;
			var posDown = 0;
			for(var i=0;i<foundPost.downvoters.length;i++){
				if(foundPost.downvoters[i].equals(req.user._id)){
					existsDown = true;
					posDown = i;
					break;
				}
			}
			console.log(status + " " + existsUp + " " + existsDown);
			if(status == "up"){
				if(existsDown){
					if(existsUp){
						foundPost.upvoters.splice(posUp);
						foundPost.downvoters.splice(posDown);
					} else {
						foundPost.downvoters.splice(posDown);
						foundPost.upvoters.push(req.user._id);
						foundPost.points += 2;
					}
				} else {
					if(existsUp){
						foundPost.upvoters.splice(posUp);
						foundPost.points--;
					} else {
						foundPost.upvoters.push(req.user._id);
						foundPost.points++;
					}
				}
			} else if(status == "down"){
				if(existsDown){
					if(existsUp){
						foundPost.upvoters.splice(posUp);
						foundPost.downvoters.splice(posDown);
					} else {
						foundPost.downvoters.splice(posDown);
						foundPost.points++;
					}
				} else {
					if(existsUp){
						foundPost.upvoters.splice(posUp);
						foundPost.downvoters.push(req.user._id);
						foundPost.points -= 2;
					} else {
						foundPost.downvoters.push(req.user._id);
						foundPost.points--;
					}
				}
			}
			foundPost.save();
			res.send({success: true, points: foundPost.points});
		}
	});

});

router.get("/details/:postId", function(req, res){
	var postId = req.params.postId;
	Post.findOne({"_id": postId}, function(err, foundPost){
		if(err){
			console.log(err);
			req.flash("error", "Nie znaleziono posta!");
			res.redirect("/");
		} else {
			Comment.find({"_id": foundPost.comments}, function(err, coms){
				if(err){
					console.log(err);
				} else {
					res.render("posts/show", {post: foundPost, category: "all", comments: coms});
				}
			})
			
		}
	});
});

router.post("/details/:id", middleware.isLoggedIn, function(req, res){ //komentowanie
	if(req.xhr || req.accepts('json,html') === 'json'){
		var id = req.params.id;
		var comment = req.body.comment;
		var newComment = {
			text: comment,
			date: Date.now(),
			points: 0,
			author: {
				id: req.user._id,
				username: req.user.username
			}
		}

		Post.findOne({"_id": id}, function(err, foundPost){
			if(err){
				console.log(err);
			} else {
				Comment.create(newComment, function(err, newlyCreated){
					if(err){
						console.log(err);
						req.flash("error", "Nie udalo sie dodac komentarza");
						res.redirect("back");
					} else {
						foundPost.comments.push(newlyCreated);
						foundPost.save();
						res.send({success: true});
					}
				});
			}
		});
	} else {
		console.log("req.xhr nie akceptowany");
	}
	
});



router.get("/:category/:time/:page", function(req, res){
	var category = req.params.category.toLowerCase();
	var page = req.params.page;
	var valid = false;
	var postsToDisplay = []; //max 19 postow do wyswietlenia //get subarray
	var pages = {
		all: 1,
		curr: 1
	}
	for(var i=0;i<categories.length;i++){
		if(category == categories[i].name){
			valid = true;
		}
	}
	if(!valid){
		Post.find({}, function(err, foundPosts){
			if(err){
				console.log(err);
				res.send("db error");
			} else {
				if(req.params.time === "alltime"){
						pages.all = Math.ceil(foundPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						foundPosts.sort(compareDates);
						foundPosts = foundPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: foundPosts, category: "all", categories: categories, pages: pages});
					}
				else if(req.params.time === "24h"){
					var selectedPosts =[];
					foundPosts.forEach(function(post){
					if(post.date.getTime() > (new Date().getTime() - (24 * 60 * 60 * 1000)) ){
						selectedPosts.push(post);
					}
				});
					pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
					pages.curr = page;
					selectedPosts.sort(compareDates);
					selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
					res.render("posts/index", {posts: selectedPosts, category: "all", categories: categories, pages: pages});
				} else if(req.params.time === "48h"){
					var selectedPosts= [];
					foundPosts.forEach(function(post){
						if(post.date.getTime() > (new Date().getTime() - (48 * 60 * 60 * 1000)) ){
							selectedPosts.push(post);
						}
					});
					pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
					pages.curr = page;
					selectedPosts.sort(compareDates);
					selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
					res.render("posts/index", {posts: selectedPosts, category: "all", categories: categories, pages: pages});
				} else if(req.params.time === "72h"){
					var selectedPosts = [];
					foundPosts.forEach(function(post){
						if(post.date.getTime() > (new Date().getTime() - (72 * 60 * 60 * 1000)) ){
							selectedPosts.push(post);
						}
					});
					pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
					pages.curr = page;
					selectedPosts.sort(compareDates);
					selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
					res.render("posts/index", {posts: selectedPosts, category: "all", categories: categories, pages: pages});
				} else {
					res.redirect("/");
				}
			}
		});
	} else {
		if(category === "wykopalisko"){
			Post.find({}, function(err, foundPosts){
				if(err){
					console.log(err);
					res.send("db error");
				} else {
					if(req.params.time === "alltime"){
						pages.all = Math.ceil(foundPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						foundPosts.sort(compareDates);
						foundPosts = foundPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: foundPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					}
					else if(req.params.time === "24h"){
						var selectedPosts =[];
						foundPosts.forEach(function(post){
						if(post.date.getTime() > (new Date().getTime() - (24 * 60 * 60 * 1000)) ){
								selectedPosts.push(post);
							}
						});
						pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						selectedPosts.sort(compareDates);
						selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					} else if(req.params.time === "48h"){
						var selectedPosts= [];
						foundPosts.forEach(function(post){
							if(post.date.getTime() > (new Date().getTime() - (48 * 60 * 60 * 1000)) ){
								selectedPosts.push(post);
							}
						});
						pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						selectedPosts.sort(compareDates);
						selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					} else if(req.params.time === "72h"){
						var selectedPosts = [];
						foundPosts.forEach(function(post){
							if(post.date.getTime() > (new Date().getTime() - (72 * 60 * 60 * 1000)) ){
								selectedPosts.push(post);
							}
						});
						pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						selectedPosts.sort(compareDates);
						selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					} else {
						res.redirect("/");
					}
				}
			});
		} else if(category === "hity"){
			Post.find({}, function(err, foundPosts){
				if(err){
					console.log(err);
					res.send("db error");
				} else {
					if(req.params.time === "alltime"){
						pages.all = Math.ceil(foundPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						foundPosts.sort(compareDates);
						foundPosts.sort(comparePoints);
						foundPosts = foundPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: foundPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					}
					else if(req.params.time === "24h"){
					var selectedPosts =[];
					foundPosts.forEach(function(post){
					if(post.date.getTime() > (new Date().getTime() - (24 * 60 * 60 * 1000)) ){
							selectedPosts.push(post);
						}
					});
					pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
					pages.curr = page;
					selectedPosts.sort(compareDates);
					selectedPosts.sort(comparePoints);
					selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					} else if(req.params.time === "48h"){
						var selectedPosts= [];
						foundPosts.forEach(function(post){
							if(post.date.getTime() > (new Date().getTime() - (48 * 60 * 60 * 1000)) ){
								selectedPosts.push(post);
							}
						});
						pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						selectedPosts.sort(compareDates);
						selectedPosts.sort(comparePoints);
						selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					} else if(req.params.time === "72h"){
						var selectedPosts = [];
						foundPosts.forEach(function(post){
							if(post.date.getTime() > (new Date().getTime() - (72 * 60 * 60 * 1000)) ){
								selectedPosts.push(post);
							}
						});
						pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						selectedPosts.sort(compareDates);
						selectedPosts.sort(comparePoints);
						selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					} else {
						res.redirect("/");
					}
				}
			});
		} else {
			Post.find({category: category}, function(err, foundPosts){
			if(err){
				console.log(err);
				res.send("db error");
			} else {
				if (category == "ksiazki") {
					category = "książki"
				}
				if(req.params.time === "alltime"){
						pages.all = Math.ceil(foundPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						foundPosts.sort(compareDates);
						foundPosts = foundPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: foundPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
					}
				else if(req.params.time === "24h"){
					var selectedPosts = [];
					foundPosts.forEach(function(post){
						if(post.date.getTime() > (new Date().getTime() - (24 * 60 * 60 * 1000)) ){
							selectedPosts.push(post);
						}
					});
					pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
					pages.curr = page;
					selectedPosts.sort(compareDates);
					selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
					res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
				} else if(req.params.time === "48h"){
					var selectedPosts =[];
					foundPosts.forEach(function(post){
						if(post.date.getTime() > (new Date().getTime() - (48 * 60 * 60 * 1000)) ){
							selectedPosts.push(post);
						}
					});
					pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
					pages.curr = page;
					selectedPosts.sort(compareDates);
					selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
					res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
				} else if(req.params.time === "72h"){
					var selectedPosts =[];
					foundPosts.forEach(function(post){
						if(post.date.getTime() > (new Date().getTime() - (72 * 60 * 60 * 1000)) ){
							selectedPosts.push(post);
						}
					});
					pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
					pages.curr = page;
					selectedPosts.sort(compareDates);
					selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
					res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages});
				} else {
					res.redirect("/");
				}

			}
		});
	}
}
	
});



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
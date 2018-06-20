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

var numberOfPostsOnPage = 7;//podzielne przez 3 + 1

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

router.post("/adddetails", middleware.isLoggedIn, function(req, res){
	var title;
	var desc;

	var link = req.body.link.toString();
	//console.log(link);
	link.replace(/\s/g, "");
	if(!link || link.length===0){
		res.render("posts/wrongLink");
	}

	scrapeit(link, {
	    title1: {
	    	selector: "article h1",
	    	textteq: 1
	    },
	    title2: {
	    	selector: "article h2",
	    	textteq: 1
	    },
	    title3: {
	    	selector: "h1",
	    	textteq: 1
	    },
	    desc: {
	    	selector: "article p",
	    	textteq: 1
	    },
	    desc2: {
	    	selector: "p",
	    	textteq: 1
	    }
	}).then(({ data, response }) => {
		if(data.title1.length > 1){
			title = data.title1;
		} else if (data.title2.length > 1){
			title = data.title2;
		} else {
			title = data.title3;
		}
		//////////////////////
		if(data.desc.length > 1){
			desc = data.desc;
		} else {
			desc = data.desc2;
		}
		if(title.length > 149){
			title = title.substring(0, 146).replace(/(\r\n\t|\n|\r\t)/gm, "");
			title.concat("...");
		}
		if(desc.length > 299){
			desc = desc.substring(0, 296).replace(/(\r\n\t|\n|\r\t)/gm, "");
			desc.concat("...");
		}
	    

	    var scraper = new Scraper(link);
	 	var images = [];
	  	scraper.scrape(function(image) {
	     	images.push(image.address);
	    }, function(){
	      var uniqueImages = images.filter(function(item, pos) {
	          return images.indexOf(item) == pos;
	      })
	      //console.log(title  + " " + desc);
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

router.get("/edit/:postId", middleware.checkPostOwnership, function(req, res){
	Post.findById(req.params.postId, function(err, foundPost){
		if(err){
			console.log(err);
			res.redirect("/");
		} else {
			if(!foundPost){
				res.redirect("/");
			}
			res.render("posts/edit", {post: foundPost});
		}
	});
});

router.put("/edit/:postId", middleware.checkPostOwnership, function(req, res){

	Post.update({_id: req.params.postId}, { $set: { 
		title: req.body.title,
		description: req.body.description,
		image: req.body.image,
		category: req.body.category.toLowerCase(),
		date: Date.now(),
	 }})
    .exec()
    .then(result => {
        req.flash("success", "Zaktualizowano post!");
		res.redirect("/posts/details/" + req.params.postId);
    })
    .catch(err => {
        console.log(err);
        req.flash("error", "Wystąpił błąd");
		res.redirect("/");
    });
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

router.post("/votecomment/:id/:status", middleware.isLoggedIn ,function(req, res){
	var commentId = req.body.id;
	var status = req.params.status;
	Comment.findOne({"_id": commentId}, function(err, foundComment){
		if(err){
			console.log(err);
			req.flash("error", "Nie znaleziono komentarza!");
			res.redirect("/");
		} else {
			var existsUp = false;
			var posUp = 0;
			for(var i=0;i<foundComment.upvoters.length;i++){
				if(foundComment.upvoters[i].equals(req.user._id)){
					existsUp = true;
					posUp = i;
					break;
				}
			}
			var existsDown = false;
			var posDown = 0;
			for(var i=0;i<foundComment.downvoters.length;i++){
				if(foundComment.downvoters[i].equals(req.user._id)){
					existsDown = true;
					posDown = i;
					break;
				}
			}
			console.log(status + " " + existsUp + " " + existsDown);
			if(status == "up"){
				if(existsDown){
					if(existsUp){
						foundComment.upvoters.splice(posUp);
						foundComment.downvoters.splice(posDown);
					} else {
						foundComment.downvoters.splice(posDown);
						foundComment.upvoters.push(req.user._id);
						foundComment.points += 2;
					}
				} else {
					if(existsUp){
						foundComment.upvoters.splice(posUp);
						foundComment.points--;
					} else {
						foundComment.upvoters.push(req.user._id);
						foundComment.points++;
					}
				}
			} else if(status == "down"){
				if(existsDown){
					if(existsUp){
						foundComment.upvoters.splice(posUp);
						foundComment.downvoters.splice(posDown);
					} else {
						foundComment.downvoters.splice(posDown);
						foundComment.points++;
					}
				} else {
					if(existsUp){
						foundComment.upvoters.splice(posUp);
						foundComment.downvoters.push(req.user._id);
						foundComment.points -= 2;
					} else {
						foundComment.downvoters.push(req.user._id);
						foundComment.points--;
					}
				}
			}
			foundComment.save();
			res.send({success: true, points: foundComment.points});
		}
	});

});

router.get("/details/:postId", function(req, res){
	var postId = req.params.postId;
	Post.findOne({_id: postId})
	.populate({
		path: 'comments',
		populate: {
			path: 'replies',
			model: "Comment"
		}
	})
	.exec((err, foundPost) => {
		if(err || !foundPost){
			req.flash("error", "Nie znaleziono posta!");
			res.redirect("/");
		} else {
			res.render("posts/show", {post: foundPost, category: "all"})
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
				username: req.user.username,
				image: req.user.image
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


router.post("/details/:id/reply/:commentid", middleware.isLoggedIn, function(req, res){ //komentowanie
	var commentid = req.params.commentid;
	if(req.xhr || req.accepts('json,html') === 'json'){
		var id = req.params.id;
		var comment = req.body.comment;
		var newComment = {
			text: comment,
			date: Date.now(),
			points: 0,
			author: {
				id: req.user._id,
				username: req.user.username,
				image: req.user.image
			}
		}

		Post.findOne({"_id": id}, function(err, foundPost){
			if(err){
				console.log(err);
			} else {
				if(!foundPost){
					console.log(err);
					return res.redirect("back");
				}
				Comment.findOne({"_id": commentid}, function(err, foundComment){
					if(err){
						console.log(err);
						return res.redirect("back");
					} else {
						Comment.create(newComment, function(err, newlyCreated){
							if(err){
								console.log(err);
								req.flash("error", "Nie udalo sie dodac komentarza");
								res.redirect("back");
							} else {
								//foundPost.comments.push(newlyCreated);
								//foundPost.save();
								foundComment.replies.push(newlyCreated._id);
								foundComment.save();
								res.send({success: true});
							}
						});
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
		if(category === "eksploracja"){
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
					var archiwum = []; //wypelnic archiwum miesiacami
					var poczatek = new  Date(2017, 7, 1);
					var dzis = new Date();
					var dzisDzien = dzis.getDate();
					var dzisMiesiac = dzis.getMonth() + 1;
					var dzisRok = dzis.getFullYear();
					//console.log(dzisDzien + " " + dzisMiesiac + " " + dzisRok);

					var ileMiesiecyMinelo =  dzis.getMonth() - poczatek.getMonth() + (12 * (dzis.getFullYear() - poczatek.getFullYear()));
					console.log(ileMiesiecyMinelo);
					var miesiac;
					for(var o =0; o<ileMiesiecyMinelo + 1; o++){
						switch (dzisMiesiac) {
								case 1:
								miesiac = 'Styczeń';
								break;
								case 2:
								miesiac = 'Luty';
								break;
								case 3:
								miesiac = 'Marzec';
								break;
								case 4:
								miesiac = 'Kwiecień';
								break;
								case 5:
								miesiac = 'Maj';
								break;
								case 6:
								miesiac = 'Czerwiec';
								break;
								case 7:
								miesiac = 'Lipiec';
								break;
								case 8:
								miesiac = 'Sierpień';
								break;
								case 9:
								miesiac = 'Wrzesień';
								break;
								case 10:
								miesiac = 'Pażdziernik';
								break;
								case 11:
								miesiac = 'Listopad';
								break;
								case 12:
								miesiac = 'Grudzień';
								break;
						}
						archiwum.push({
							text: miesiac + " " + dzisRok,
							date: dzisMiesiac + "_" + dzisRok
						});
						dzisMiesiac--;
						if(dzisMiesiac==0){
							dzisMiesiac=12;
							dzisRok--;
						}
					}
					//console.log(archiwum);

					if(req.params.time === "alltime"){
						pages.all = Math.ceil(foundPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						foundPosts.sort(compareDates);
						foundPosts.sort(comparePoints);
						foundPosts = foundPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: foundPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages, archiwum: archiwum});
					}
					else if(req.params.time === "dnia"){
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
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages, archiwum: archiwum});
					} else if(req.params.time === "miesiaca"){
						var selectedPosts= [];
						foundPosts.forEach(function(post){
							if(post.date.getTime() > (new Date().getTime() - (24 * 30 * 60 * 60 * 1000)) ){
								selectedPosts.push(post);
							}
						});
						pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						selectedPosts.sort(compareDates);
						selectedPosts.sort(comparePoints);
						selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages, archiwum: archiwum});
					} else if(req.params.time === "roku"){
						var selectedPosts = [];
						foundPosts.forEach(function(post){
							if(post.date.getTime() > (new Date().getTime() - (24 * 365 * 60 * 60 * 1000)) ){
								selectedPosts.push(post);
							}
						});
						pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						selectedPosts.sort(compareDates);
						selectedPosts.sort(comparePoints);
						selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages, archiwum: archiwum});
					} else {
						var czas = req.params.time;
						var miesiac = parseInt(czas.split('_')[0]);
						var rok = parseInt(czas.split("_")[1]);
						if(rok == NaN || miesiac == NaN){
							return res.redirect('/');
						}
						var miesiacc = miesiac + 1;
						if(miesiacc > 12){
							rok++;
							miesiacc =0;
						}

						var selectedPosts = [];
						foundPosts.forEach(function(post){
							if( post.date.getTime() > (new Date(rok, miesiac-1).getTime()) && post.date.getTime() < (new Date(rok, miesiacc -1).getTime())){
								selectedPosts.push(post);
							}
						});
						pages.all = Math.ceil(selectedPosts.length/numberOfPostsOnPage);
						pages.curr = page;
						selectedPosts.sort(compareDates);
						selectedPosts.sort(comparePoints);
						selectedPosts = selectedPosts.slice((page-1)*numberOfPostsOnPage, page*numberOfPostsOnPage);
						res.render("posts/index", {posts: selectedPosts, category: category.charAt(0).toUpperCase() + category.slice(1), categories: categories, pages: pages, archiwum: archiwum});

					}
				}
			});
		} else {
			Post.find({category: category}, function(err, foundPosts){
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
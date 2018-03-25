var express = require("express");
var app = express();
var router = express.Router();




router.get("/about", function(req, res){
	render("about");
});

router.get("/", function(req, res){
    res.render("landing");
});

// function isLoggedIn(req, res, next){
// 	if(req.isAuthenticated()){
// 		return next();
// 	}
// 	res.redirect("/login");
// }

module.exports = router;
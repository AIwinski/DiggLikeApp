var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
var passport = require("passport");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var flash = require("connect-flash");
const path = require('path');
const morgan = require('morgan')
const session = require('express-session');
var middleware = require("./middleware/index");

require('./config/passport');

mongoose.Promise = global.Promise;

var commentRoutes = require("./routes/comments");
var indexRoutes = require("./routes/index");
var postRoutes = require("./routes/posts");
var userRoutes = require("./routes/users");

mongoose.connect("mongodb://localhost/zlecenie4");
//mongoose.connect("mongodb://artur:123456@ds121299.mlab.com:21299/zlecenie");

var Comment = require("./models/comment");
var User = require("./models/user");
var Post = require("./models/post");




app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method")); 
app.use(flash());
app.use(morgan('dev'));

app.use(require("express-session")({
	secret: "once again some text here",
	resave: false,
	saveUninitialized: false
}));

app.use(session({
  cookie: { maxAge: 60000 },
  secret: 'codeworkrsecret',
  saveUninitialized: false,
  resave: false
}));

app.use(passport.initialize());
app.use(passport.session());



app.use(function(req, res, next){ 
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");  
	next(); 
});							
 
//DO EDYCJI=======================================================

//app.use("/blogs/:blogId/posts", postRoutes);
//app.use("/blogs/:blogId/posts/:postId/comments", commentRoutes);
//app.use("/blogs", blogRoutes);
app.use(indexRoutes);
app.use('/users', require('./routes/users'));






app.listen(process.env.PORT || 3000, function(){
	console.log("server started!");
});
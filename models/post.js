var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
	title: String,
	image: String,
	text: String,
	date: Date,
	points: Number,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	]
});

module.exports = mongoose.model("Post", postSchema);
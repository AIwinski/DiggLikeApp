var mongoose = require("mongoose");

var postSchema = new mongoose.Schema({
	link: String,
	title: String,
	image: String,
	description: String,
	date: {type: Date, default: Date.now},
	points: {type: Number, default: 0},
	category: String,
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
	],
	upvoters: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	],
	downvoters: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	],
	fav: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

module.exports = mongoose.model("Post", postSchema);
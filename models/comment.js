var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
	text: String,
	date: Date,
	points: {type: Number, default: 0},
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String,
		image: String
	},
	replies: [
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
});

module.exports = mongoose.model("Comment", commentSchema);
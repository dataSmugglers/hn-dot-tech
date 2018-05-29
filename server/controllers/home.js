'use strict';

var Post = require('../models/Post');
var mongoose = require('mongoose');
var hn = require('hackernews-api');

module.exports.home = home;

function home (req, res) {
    var url = "mongodb://localhost:27017/hndb";
    mongoose.Promise = global.Promise;
    mongoose.connect(url);

    var myData = new Post();

/*    myData.save().catch(err => {
	res.status(400).send("400 eerrrr");
    });
*/    
    var topPostId = hn.getTopStories(1);
    var topPost = hn.getItem(topPostId[0]);
    var string = JSON.stringify(topPost);
    res.render('index',  { title: string });
}


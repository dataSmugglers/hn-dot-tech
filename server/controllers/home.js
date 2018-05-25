'use strict';

var post = require('../models/post');
var mongoose = require('mongoose');
var hn = require('hackernews-api');

module.exports.home = home;

function home (req, res) {
    var topPostId = hn.getTopStories(1);
    var topPost = hn.getItem(topPostId[0]);
    var string = JSON.stringify(topPost);
    res.render('index',  { title: string });
}


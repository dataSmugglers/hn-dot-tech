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
    Post.find({}, function (err, posts) {
      if (err) return res.status(400).send(err);
      res.render('index', {title: posts});
    });
}


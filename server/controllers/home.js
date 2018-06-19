'use strict';

var Post = require('../models/Post');
var mongoose = require('mongoose');
var hn = require('hackernews-api');

module.exports.home = home;

function home (req, res) {
    var url = "mongodb://localhost:27017/hndb";
    mongoose.Promise = global.Promise;
    mongoose.connect(url);

    const currentDate = new Date();
    const startOfcurrentDate = new Date(currentDate.getFullYear(),
        currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
    var myData = new Post();
    Post.find({}, function (err, all_posts) {
      if (err) return res.status(400).send(err);
      Post.find({initTimeAsTop: {
          $gte: startOfcurrentDate,
          $lte: currentDate} },
          function(err, today_posts){
            if (err) return res.status(400).send(err);
            res.render('index', {title: all_posts, today_posts: today_posts});
          }
      );
    });
}


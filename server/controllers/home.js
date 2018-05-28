'use strict';

var post = require('../models/post');
var mongoose = require('mongoose');

module.exports.home = home;

function home (req, res) {

  // database setup
  var url = "mongodb://localhost:27017/hndb";
  mongoose.Promise = global.promise;
  mongoose.connect(url);

  var myData = new Post(
  
  res.render('index',  { title: 'hn-dot-tech' });
}


'use strict';

var post = require('../models/post');
var mongoose = require('mongoose');

module.exports.home = home;

function home (req, res) {
  
  res.render('index',  { title: 'hn-dot-tech' });
};


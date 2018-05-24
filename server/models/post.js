'use strict';

var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    title: String,
    url: String,
    votes: Number,
    initTimeAsTop: Number,
    finalTimeAsTop: Number
});

var Post = mongoose.model('Post', postSchema);

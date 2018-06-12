'use strict';

var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    hnid: Number,
    title: String,
    url: String,
    votes: Number,
    initTimeAsTop: [Date],
    finalTimeAsTop: [Date]
});

module.exports = mongoose.model('Post', postSchema);

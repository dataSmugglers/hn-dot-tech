'use strict';

/*
 * Title: apiRequests
 * Description: Every minute this module will send an api request
 *  to the hackernews api to get the latest top link.
 *
 */

/*
 * Methods of achieving goal:
 * - Make a cron job that every minute runs the apiRequests script
 * - Make the script itself run every minute 

/*
var Post = require('../models/Post');
var mongoose = require('mongoose');
var hn = require('hackernews-api');

module.exports.home = home;

function home (req, res) {
    var url = "mongodb://localhost:27017/hndb";
    mongoose.Promise = global.Promise;
    mongoose.connect(url);

    var myData = new Post();

    myData.save().catch(err => {
        res.status(400).send("400 eerrrr");
    });

    var topPostId = hn.getTopStories(1);
    var topPost = hn.getItem(topPostId[0]);
    var string = JSON.stringify(topPost);
    res.render('index',  { title: string });
}
*/

const sleep = require('util').promisify(setTimeout);

async function main() {
  var goOn = true;
  while(goOn) {
    console.time("Slept for");
    await sleep(3000);
    console.timeEnd("Slept for");
  }
}
main();


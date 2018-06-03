'use strict';

/*
 * Dev Note:
 * [Tue May 29 13:19:52 2018]: I got the first working code to keep a
 * Javascript file running. I have no idea if this is the best way to
 * do it but I will take on a bit of technical debt because I could 
 * not successfully do a google search to find the optimal way of 
 * doing this. I will write unit tests and try/catch tests to keep
 * testing functionality.
 */

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
 */

var Post = require('../models/Post');
var mongoose = require('mongoose');
var hn = require('hackernews-api');
var url = "mongodb://localhost:27017/hndb";
const sleep = require('util').promisify(setTimeout);

const winston = require('winston');
const fs = require('fs');
const logDir = 'log';

// create the log file
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => (new Date()).toLocaleTimeString();

// Create Winston Logger
const logger = new (winston.Logger) ({
  transports: [
    new (winston.transports.File)({
      filename: `${logDir}/combined.log`,
      timestamp: tsFormat
    }),
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      level: 'info'
    }),
  ]
});



async function main() {
    var goOn = true;

    logger.log('info', 'MAIN: main has started');

    while(goOn) {
  	// Connect to DB
        mongoose.connect(url);
     	var db = mongoose.connection;
     	db.on('error', console.error.bind(console, 'connection error:'));

     	db.once('open', function() {
          logger.log('info', 'MAIN: db is open');

          var topPostId = hn.getTopStories();
          var firstTopPost = hn.getItem(topPostId[0]);
          logger.log('info', firstTopPost);
          Post.find({hnid: topPostId[0]}, function(err, posts){
              // Post is not found, insert new post
              if(err) {
                logger.log('error', err);
              }
              // Found one or more posts
              if (posts.length) {
                logger.log('info', 'Found Post with same id, not saving');
              }
              // Didnt file post in db
              else{
                logger.log('info', "Didnt find post in DB, Proceed to insert");
                var myData = new Post({
                hnid: firstTopPost.id, title: firstTopPost.title,
                url: firstTopPost.url, votes: firstTopPost.score
                });
                myData.save(function(err) {
                  if (err) {
                    return logger.log('error', 'DB: Could not save to db');
                  }
                });
                logger.log('info', 'DB: Successfully saved new post to DB');
              }
              // Did find in DB, don't save it
          });
      });
      logger.log('info', 'Sleeping for 60 seconds');
      await sleep(60000);
    }
}

main();


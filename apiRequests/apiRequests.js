'use strict';


/*
 * Title: apiRequests
 * Description: Every minute this module will send an api request
 *  to the hackernews api to get the latest top link.
 *
 */

/*
 * Methods of achieving goal:
 * - Make the script itself run every minute
 */

var Post = require('../server/models/Post');
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
    var lastTopPost = 0;

    logger.log('info', 'MAIN: main has started');

    while(goOn) {
  	// Connect to DB
        var db = connectToDatabase(url);

     	db.once('open', function() {
          logger.log('info', 'MAIN: db is open');

          var topPostId = getHackerNewsApiRequest_TopPosts();

          var firstTopPost = getHackerNewsApiRequest_TopPostInfo(topPostId);
          logger.log('info', firstTopPost);

          // Make sure that this post is the same top post
          if ( topPostId[0] === lastTopPost ) {
              logger.log('info',
                  "The current top post recieved == the last known top post");
          }

          // There has been a 'top post' change
          else {
              // Enter the now-old top post's end time if not a new db
              if ( lastTopPost != 0) {

                  logger.log('info', 'DETECTED top post change!');
                  logger.log('info', 'Searching for old top post');
                  Post.find({hnid: topPostId[lastTopPost]}, function (err, posts) {
                      if (err) {
                          logger.log('error', err);
                      }
                      // Found one or more posts
                      if (posts.length) {
                          posts.finalTimeAsTop.push(new Date());
                          posts.save(function (err) {
                              return logger.log('error',
                                  'Problem Saving finalTimeAsTop');
                          });

                          logger.log('info', 'Found Post, updated final time');
                      }
                      else {
                          logger.log('error', 'Something went terribly wrong.' +
                              ' Could not file the now-old top post in db Code:45');
                      }
                  });
              }
              // Spot Hero app.. Search for new top post in DB
              Post.find({hnid: topPostId[0]}, function(err, posts){
                  if(err) {
                      logger.log('error', err);
                  }
                  // Found one or more posts
                  if (posts.length) {
                      logger.log('info', 'Found Post with same id, updating init Time');
                      logger.log('info', posts);
                      // TODO: There is some weird error I got with this line:
                      posts.initTimeAsTop.push(new Date());
                      posts.save(function(err) {
                          return logger.log('error',
                              'Problem Saving initTimeAsTop' + err);
                      });
                  }
                  // Didnt file post in db
                  else{
                      logger.log('info', "Didnt find post in DB, Proceed to insert");
                      var myData = new Post({
                          hnid: firstTopPost.id, title: firstTopPost.title,
                          url: firstTopPost.url, votes: firstTopPost.score,
                      });
                      myData.initTimeAsTop.push(new Date());
                      myData.save(function(err) {
                          if (err) {
                              return logger.log('error', 'DB: Could not save to db');
                          }
                      });
                      logger.log('info', 'DB: Successfully saved new post to DB');
                  }
                  // Did find in DB, don't save it
              });
              lastTopPost = topPostId[0];
          }
      });
      logger.log('info', 'Sleeping for 60 seconds');
      await sleep(60000);
    }
}

function connectToDatabase(url) {
    mongoose.connect(url);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    return db;
}

function getHackerNewsApiRequest_TopPosts(){
    var topPostId = hn.getTopStories();
    return topPostId;
}

function getHackerNewsApiRequest_TopPostInfo(topPostId){
    var firstTopPost = hn.getItem(topPostId[0]);
    return firstTopPost;
}

main();


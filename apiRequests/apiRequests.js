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

/*
* @param db     a valid mongoose db connection
* @param postId a hackernews post id
* @param cb     callback(err, doc)
* @return       boolean, whether or not the id is in the db
 */
var is_Post_in_hndb = function (db, postId, callback) {
    db.once('open', function() {
        logger.log('info', 'MAIN: db is open: is_Post_in_hndb');
        Post.find({hnid: postId}, function (err, posts) {
            if (err) {
                callback(err, null);
            }
            if (posts.length) {
                callback(null, posts);
            }
            // Didnt find post in db
            else {
                callback(new Error('Didnt Find post in db'), null);
            }
        });
    });
};

var add_new_Post = function(db, top_post, callback) {
    db.once('open', function() {
        logger.log('info', 'MAIN: db is open: add_new_Post');
        var myData = new Post({
            hnid: top_post.id, title: top_post.title,
            url: top_post.url, votes: top_post.score
        });
        myData.initTimeAsTop.push(new Date());
        myData.save(function (err) {
            if (err) {
                callback(err);
            }
            callback(null);
        });
    });
}

var delete_Post_by_id = function(db, id, callback) {
    db.once('open', function(){
        logger.log('info', 'MAIN: db is open: delete_Post_by_id');
        Post.deleteOne({hnid: id}, function(err) {
            if (err) {
                callback(err);
            }
            callback(err);
        });
    });
}

var add_to_Post_finalTimeAsTop = function(db, post_id, callback) {
    db.once('open', function(){
        logger.log('info', 'MAIN: db is open: add_to_Post_finalTimeAsTop' );
        Post.findOneAndUpdate({hnid: post_id},
                {$push: {finalTimeAsTop: new Date()}}, function (err, doc) {
            if (err) {
                logger.log('error', "Could not update finalTime. Err:"+err);
                return callback(err, null);
            }
            // Found one or more posts
            else {
                logger.log('info', 'Found Post with same id, updating final Time');
                logger.log('info', 'post found id: '+ doc.hnid);
                return callback(null, doc);
            }
        });
    });
};

var add_to_Post_initTimeAsTop = function(db, post_id, callback){
    db.once('open', function(){
        logger.log('info', 'MAIN: db is open: add_to_Post_initTimeAsTop');
        Post.findOneAndUpdate({hnid: post_id},
                {$push: {initTimeAsTop: new Date()}}, function(err, doc) {
            if (err) {
                logger.log('error', "Could not update the initTimeAsTop");
                return callback(err, null);
            }
            // Able to add to initTime
            else {
                logger.log('info', '  Found Post with same id, ' +
                    'updating final Time');
                logger.log('info', '  post found id: '+ doc.hnid);
                return callback(null, doc);
            }
        });
    });
};

var top_post_cumulative_time_duration = function (db, post_id, callback) {
    return;
}
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



var start = async function() {
    var goOn = true;

    logger.log('info', 'MAIN: main has started');

    // Before loop begins, get the top post
    var topPostId = getHackerNewsApiRequest_TopPosts();
    var firstTopPost = getHackerNewsApiRequest_TopPostInfo(topPostId[0]);
    var lastTopPost = topPostId[0];

    mongoose.connect(url, { keepAlive: 120 });
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));

    is_Post_in_hndb(db, topPostId[0], function (err, post) {
        if (err) { // Didnt find post in db
            logger.log('info', "Didnt find post in DB");
            logger.log('info', "Starting process to add post to db");
            add_new_Post(db, firstTopPost, function(err){
                    if (err) logger.log('error', 'Could not add new post ERR1');
                    logger.log('info', "Successfully Added post: "+topPostId[0]);
                });
        }
        else { // Found post in db
            // Delete and add again with new initTime
            logger.log('info', 'Found Post with same id');
            delete_Post_by_id(db, topPostId[0], function (err) {
                if (err) logger.log('error', 'Could not delete post: ' + topPostId[0]);
                logger.log('info', 'Successfully deleted post (id: ' + post_id +
                    ') from db');
            });
            add_new_Post(db, firstTopPost, function (err) {
                if (err) logger.log('error', 'Could not add new post ERR2');
                logger.log('info', "Successfully Added post: " + topPostId[0]);
            });
        }
    });

    while(goOn) {


          var topPostId = getHackerNewsApiRequest_TopPosts();
          var firstTopPost = getHackerNewsApiRequest_TopPostInfo(topPostId[0]);
          logger.log('info', 'Current top post id: ' + firstTopPost.id +
              "\nCurrent top post title: " + firstTopPost.title );

          // Make sure that this post is the same top post
          if ( topPostId[0] === lastTopPost ) {
              logger.log('info',
                  "The current top post received == the last known top post");
          }

          // There has been a 'top post' change
          else {
              // Enter the now-old top post's end time if not a new db
              logger.log('info', 'DETECTED top post change!');
              logger.log('info', 'Searching for old top post');


              add_to_Post_finalTimeAsTop(db, lastTopPost, function(err, post) {
                  if (err) {
                      logger.log('error',
                          'Unsuccessfully added final_time to last top post');
                  }
                  else {
                      logger.log('info', 'UPDATED: Successfully added' +
                          'Final_time to last top post');
                  }
              });

              is_Post_in_hndb(db, topPostId[0], function(err) {
                  if (err) {
                      add_new_Post(db, firstTopPost, function(err) {
                          if (err) {
                              logger.log("error", "Could not add new TOP POST" +
                                  "to db");
                          }
                          else {
                              logger.log("info", "Successfully added new TOP " +
                                  "POST to db");
                          }
                      });
                  }
                  else {    // Didnt file post in db
                      add_to_Post_initTimeAsTop(db, topPostId, function(err) {
                          if (err) {
                              logger.log('error', err + "Found Same post but" +
                                  "Could not update initTime to db");
                          }
                          else {
                              logger.log('info', "Found Same post and" +
                                  "updated initTime to db");

                          }
                      });

                  }
              });

              lastTopPost = topPostId[0];
          }
      logger.log('info', 'Sleeping for 60 seconds');
      await sleep(60000);
    }
}

function connectToDatabase(url) {
    mongoose.connect(url, { keepAlive: 120 });
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    return db;
}

function getHackerNewsApiRequest_TopPosts(){
    var topPostId = hn.getTopStories();
    return topPostId;
}

function getHackerNewsApiRequest_TopPostInfo(topPostId){
    var firstTopPost = hn.getItem(topPostId);
    return firstTopPost;
}


module.exports.start = start;
module.exports.is_Post_in_hndb = is_Post_in_hndb;
module.exports.add_new_Post = add_new_Post;
module.exports.delete_Post_by_id = delete_Post_by_id;
module.exports.add_to_Post_finalTimeAsTop = add_to_Post_finalTimeAsTop;
module.exports.add_to_Post_initTimeAsTop = add_to_Post_initTimeAsTop;
module.exports.top_post_cumulative_time_duration = top_post_cumulative_time_duration ;

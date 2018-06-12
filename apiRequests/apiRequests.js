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

// Testing Waters
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
        Post.deleteOne({hnid: post_id}, function(err) {
            if (err) {
                callback(err);
            }
            callback(err);
        });
    });
}
var add_to_Post_finalTimeAsTop = function(db, postId, callback) {
    db.once('open', function(){
        logger.log('info', 'MAIN: db is open: add_to_Post_finalTimeAsTop' );
        Post.find({hnid: postId}, function (err, posts) {
            if (err) {
                logger.log('error', err);
                return callback(err);
            }
            // Found one or more posts
            if (posts.length) {
                logger.log('info', 'Found Post with same id, updating final Time');
                logger.log('info', 'post found id: '+posts.id);
                // TODO: There is some weird error I got with this line:
                posts.initTimeAsTop.push(new Date());
                posts.save(function (err) {
                    logger.log('error', 'Problem Saving (updating) final time')
                    return callback(err);
                });
                return callback(null);
            }
        });
    });
}

var add_to_Post_initTimeAsTop = function(db, post_id, callback){
    db.once('open', function(){
        logger.log('info', 'MAIN: db is open: add_to_Post_initTimeAsTop');
        Post.find({hnid: post_id}, function(err, posts) {
            if (err) {
                logger.log('error', err);
                return callback(err);
            }
            // Found one or more posts
            if (posts.length) {
                logger.log('info', 'Found Post with same id, updating init Time');
                logger.log('info', posts);
                // TODO: There is some weird error I got with this line:
                posts.initTimeAsTop.push(new Date());
                posts.save(function (err) {
                    logger.log('error', 'Problem Saving initTimeAsTop' + err);
                    return callback(err);
                });
                return callback(null);
            }
            return callback(null);
        });
    });
}
// END Testing Waters

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

/*
* @param db     a valid mongoose db connection
* @param postId a hackernews post id
* @return       boolean, whether or not the id is in the db
 */

/* function is_Post_in_hndb(db_url, postId){
    var db = connectToDatabase(db_url);
    var verify_in_db = true;
    db.once('open', function( ){
        logger.log('info', 'MAIN: db is open: is_Post_in_hndb');
        Post.find({hnid: postId}, function(err, posts){
            if(err) {
                logger.log('error', err);
                verify_in_db = false;
                return false;
            }
            // Found one or more posts
            if (posts.length) {
                logger.log('info', 'Found Post with same id');
                logger.log('info', 'This is the post: \n  ' + posts);
                verify_in_db = true;
                return true;
            }
            // Didnt find post in db
            else{
                logger.log('info', "Didnt find post in DB");
                verify_in_db = false;
                return false;
            }
            // Did find in DB, don't save it
        });
    });
    console.log(db);

    db.once('open', function( ){
        logger.log('info', 'MAIN: db is open: is_Post_in_hndb');
        Post.find({hnid: postId}, function(err, posts){
            if(err) {
                logger.log('error', err);
                verify_in_db = false;
                return false;
            }
            // Found one or more posts
            if (posts.length) {
                logger.log('info', 'Found Post with same id');
                logger.log('info', 'This is the post: \n  ' + posts);
                verify_in_db = true;
                return true;
            }
            // Didnt find post in db
            else{
                logger.log('info', "Didnt find post in DB");
                verify_in_db = false;
                return false;
            }
            // Did find in DB, don't save it
        });
    });
    console.log(db);
    return verify_in_db;
}
*/

/*
* @param db     a valid mongoose db connection
* @param postId a hackernews post id
* @return       boolean, whether or not the id is in the db
 */

/*
function add_to_Post_finalTimeAsTop(db_url, postId) {
    var db = connectToDatabase(db_url);
    db.once('open', function() {
        logger.log('info', 'MAIN: db is open: add_to_Post_finalTimeAsTop');
        Post.find({hnid: postId}, function (err, posts) {
            if (err) {
                logger.log('error', err);
                return false;
            }
            // Found one or more posts
            if (posts.length) {
                logger.log('info', 'Found Post with same id, updating final Time');
                logger.log('info', posts);
                // TODO: There is some weird error I got with this line:
                posts.initTimeAsTop.push(new Date());
                posts.save(function (err) {
                    logger.log('error', 'Problem Saving final time')
                    return false;
                });
                return true;
            }
        });
    });
    return false;
}

function add_to_Post_initTimeAsTop(db_url, post_id){
    var db = connectToDatabase(db_url);
    db.once('open', function(){
        logger.log('info', 'MAIN: db is open: add_to_Post_initTimeAsTop');
        Post.find({hnid: post_id}, function(err, posts) {
            if (err) {
                logger.log('error', err);
                return false;
            }
            // Found one or more posts
            if (posts.length) {
                logger.log('info', 'Found Post with same id, updating init Time');
                logger.log('info', posts);
                // TODO: There is some weird error I got with this line:
                posts.initTimeAsTop.push(new Date());
                posts.save(function (err) {
                    logger.log('error', 'Problem Saving initTimeAsTop' + err);
                    return false;
                });
                return true;
            }
            return false;
        });
    });
}

*/

main();


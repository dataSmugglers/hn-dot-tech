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
    var lastTopPost = 0; // Im sick of this line. Im changing it to read the latest post

    logger.log('info', 'MAIN: main has started');

    // Before loop begins, get the top post

        var topPostId = getHackerNewsApiRequest_TopPosts();
        var firstTopPost = getHackerNewsApiRequest_TopPostInfo(topPostId[0]);
        lastTopPost = topPostId[0];

        if (is_Post_in_hndb(url, topPostId[0])){
            // Delete and add again with new initTime
            delete_Post_by_id(url, topPostId[0])
            add_new_Post(url, firstTopPost.id, firstTopPost.title, firstTopPost.url, firstTopPost.score);
        }
        else {
            // Add to db
            add_new_Post(url, firstTopPost.id, firstTopPost.title, firstTopPost.url, firstTopPost.score);
        }

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
              if (add_to_Post_finalTimeAsTop(url, lastTopPost)) {
                  logger.log('info', 'UPDATED: Successfully added Final_time to last top post');
              }
              else {
                  logger.log('error', 'Unsuccessfully added final_time to last top post');
              }

              if (is_Post_in_hndb(url, topPostId[0])) {
                  add_to_Post_initTimeAsTop(url, topPostId);
              }
              else {    // Didnt file post in db
                  add_new_Post(url, firstTopPost.id, firstTopPost.title, firstTopPost.url, firstTopPost.score);
              }

              lastTopPost = topPostId[0];
          }
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
    var firstTopPost = hn.getItem(topPostId);
    return firstTopPost;
}

/*
* @param db     a valid mongoose db connection
* @param postId a hackernews post id
* @return       boolean, whether or not the id is in the db
 */
function is_Post_in_hndb(db_url, postId){
    var db = connectToDatabase(db_url);
    db.once('open', function(){
        logger.log('info', 'MAIN: db is open: is_Post_in_hndb');
        Post.find({hnid: postId}, function(err, posts){
            if(err) {
                logger.log('error', err);
                return false;
            }
            // Found one or more posts
            if (posts.length) {
                logger.log('info', 'Found Post with same id');
                logger.log('info', 'This is the post: \n  ' + posts);
                return true;
            }
            // Didnt find post in db
            else{
                logger.log('info', "Didnt find post in DB");
                return false;
            }
            // Did find in DB, don't save it
        });
    });
}

/*
* @param db     a valid mongoose db connection
* @param postId a hackernews post id
* @return       boolean, whether or not the id is in the db
 */
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
function add_new_Post(db_url, post_Id, post_title, post_url, post_votes){
    var db = connectToDatabase(db_url);
    db.once('open', function() {

        logger.log('info', 'MAIN: db is open: add_new_Post');
        var myData = new Post({
            hnid: post_Id, title: post_title,
            url: post_url, votes: post_votes
        });
        myData.initTimeAsTop.push(new Date());
        myData.save(function (err) {
            if (err) {
                return logger.log('error', 'DB: Could not save to db');
            }
        });
    });
}
function delete_Post_by_id(db_url, post_id){
    var db = connectToDatabase(db_url);
    db.once('open', function() {
        logger.log('info', 'MAIN: db is open: delete_Post_by_id');
        Post.deleteOne({hnid: post_id}, function(err, posts) {
            if (err) {
                logger.log('error', err);
                return false;
            }
            return true;
        });
        return false;
    });
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

main();


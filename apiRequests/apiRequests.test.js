const apiRequest = require("./apiRequests");
var Post = require('../server/models/Post');
var mongoose = require('mongoose');
var hn = require('hackernews-api');
var url = "mongodb://localhost:27017/test";
const fs = require('fs');

const winston = require('winston');
const tsFormat = () => (new Date()).toLocaleTimeString();

const logger = new (winston.Logger) ({
    transports: [
        new (winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
            level: 'info'
        })
    ]
});
var post1 = {"initTimeAsTop": [ ], "finalTimeAsTop": [ ], "id": 17261869, "title" :
        "Justice Dept. Seizes Times Reporter’s Email/Phone",
    "url" : "https://mobile.nytimes.com/2018/06/07/us/politics/",
    "votes" : 189
};

var post2 = {
    "initTimeAsTop": [ ], "finalTimeAsTop": [ ], "id": 17262510,
    "title": "Home Depot stocked shelves with empty boxes in its early days",
    "url": "https://www.cnbc.com/2018/06/01/home-depot-co-founder-ken-langone-on-the-early-days-of-the-business.html",
    "votes": 77
};


beforeEach( () => {
    mongoose.connect(url);
});

afterEach( () => {
    mongoose.connection.close();
});


// mongoose.connect(url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


test('Insert a new post', done => {
    function callback(err) {
        expect(err).toBe(null);
        logger.log('info', "TEST: add_new_Post seems to work");
        done();
    }
    apiRequest.add_new_Post(db, post1, callback);
});

test('Check if a post exists that is IN DB', done => {
    function callback(err) {
        expect(err).toBe(null);
        logger.log('info', "TEST: is_Post_in_hndb seems to work");
        done();
    }
    apiRequest.is_Post_in_hndb(db, post1.id, callback);
});

test('Check if a post exists that is NOT in DB', done => {
    function callback(err) {
        expect(err).not.toBe(null);
        logger.log('info',
            "TEST[non-existent]: is_Post_in_hndb seems to work");
        logger.log('info', "TEST[non-existent]: is_Post_in_hndb err: " +err);
        done();
    }
    apiRequest.is_Post_in_hndb(db, post2.id, callback);
});

test('Add Final Time to a post.', done => {
    function callback(err, doc) {
    expect(err).toBe(null);
    logger.log('info', 'TEST: add_to_Post_finalTimeAsTop starting')
    expect(doc.finalTimeAsTop).not.toBe([]);
    done();
}
apiRequest.add_to_Post_finalTimeAsTop(db, post1.id, callback);
});

test('Add Initial_Time to a post.', done => {
    function callback(err, doc) {
        logger.log('info',
        "TEST: add_to_Post_initTimeAsTop starting");
        expect(err).toBe(null);
        expect(doc.initTimeAsTop).not.toBe([]);
        done();
    }
    apiRequest.add_to_Post_initTimeAsTop(db, post1.id, callback);
});

test('Add Final Time to a post.', done => {
    function callback(err, doc) {
        expect(err).toBe(null);
        logger.log('info', 'TEST: add_to_Post_finalTimeAsTop starting')
        expect(doc.finalTimeAsTop).not.toBe([]);
        done();
    }
    apiRequest.add_to_Post_finalTimeAsTop(db, post1.id, callback);
});

test('Update score to a post.', done => {
    function callback(err, doc) {
        logger.log('info', 'TEST: Update_Score starting')
        expect(err).toBe(null);
        done();
    }
    apiRequest.update_Post_score(db, post1, callback);
});

test('Calculating running top_post time', done => {
    function callback(err) {
    expect(err).toBe(null);
    logger.log('info', 'TEST: updated Duration');
    done();
}
apiRequest.add_to_Post_durationAsTop(db, post1.id, callback);
});

test('Delete a new post', done => {
    function callback(err) {
        expect(err).toBe(null);
        logger.log('info', 'TEST: Deleted post')
        done();
    }
    apiRequest.delete_Post_by_id(db, post1.id, callback);
});

test('clean up by deleting all in db', done => {
    function callback(err){
        expect(err).toBe(null);
        done();
    }
    var clean = function(db, callback) {
        db.once('open', function() {
            Post.deleteMany({}, function(err) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, "something");
                }

            });
        });
    };
    clean(db, callback);
});

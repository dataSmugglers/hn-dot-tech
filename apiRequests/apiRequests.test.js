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
var post1 = {"hnid" : 17261869, "title" :
    "Justice Dept. Seizes Times Reporter’s Email/Phone Records in Leak Investigation",
    "url" : "https://mobile.nytimes.com/2018/06/07/us/politics/times-reporter-phone-records-seized.html",
    "votes" : 189, "__v" : 0 }

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
        mongoose.connection.close();
        done();
    }

    apiRequest.add_new_Post(db, post1, callback);
});

/*
test('Delete a new post', done => {
    function callback(err) {
    expect(err).toBe(null);
    //mongoose.disconnect();
    done();
}

apiRequest.delete_Post_by_id(db, 17261869, callback);

});
*/

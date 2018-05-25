var express = require('express');
var router = express.Router();
var indexController = require('../controllers/home');

/* GET home page. */
router.get('/', indexController.home);

module.exports = router;

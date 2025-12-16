
const express = require('express');
const router = express.Router();
const db = require("../db");
const { findUser } = require('../auth');
const auth = require("../auth");
const sendMail = require("../mail");
const passport = require("passport");



/* GET home page. */
router.get('/speechEditor', function(req, res, next) {
 
      res.render("speechEditor", {title: "Speech Editor", message:""});    
   
    });
   
  



module.exports = router;
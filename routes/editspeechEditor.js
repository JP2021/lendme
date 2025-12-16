
const express = require('express');
const router = express.Router();
const db = require("../db");
const { findUser } = require('../auth');
const auth = require("../auth");
const sendMail = require("../mail");
const passport = require("passport");



/* GET home page. */
router.get('/edit', function(req, res, next) {
 
      res.render("edit", {title: "", message:""});    
   
    });
   
  



module.exports = router;
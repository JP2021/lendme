
const express = require('express');
const router = express.Router();
const db = require("../db");

/* GET home page. */
router.get('/', function(req, res, next) {
 
      res.render("index", {title: "Bem vindo", userProfile: parseInt(req.user.profile)});
    
   
    });



module.exports = router;

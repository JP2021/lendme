const express = require('express');
const router = express.Router();
const db = require('../db');

// Página inicial
router.get('/', function(req, res, next) {
    res.render("busca", { title: "",results: [] });
});

// Página de pesquisa
router.get('/busca', (req, res) => {
    res.render('busca', { title: "Bem vindo", results: [] });
});

// Processar pesquisa
router.post('/', async (req, res) => {
    const query = req.body.query;
    try {
        const results = await db.searchOSByName(query);
        res.render('busca', { title: "", results });
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const db = require('../db');

// Rota para listar auto textos do usuário
router.get('/autotext', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado!" });
    }

    const userId = req.user._id;

    try {
        const autoTexts = await db.findAutoTextsByUserId(userId);
        res.status(200).json(autoTexts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao listar auto textos" });
    }
});

// Rota para buscar um auto texto por nome
router.get('/autotext/by-name', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado!" });
    }

    const { name } = req.query;
    const userId = req.user._id;

    console.log(`Requisição recebida: name=${name}, userId=${userId}`);

    if (!name) {
        return res.status(400).json({ message: "O nome do auto texto é obrigatório!" });
    }

    try {
        const autoText = await db.findAutoTextByName(name, userId);

        if (!autoText) {
            console.log('Auto texto não encontrado');
            return res.status(404).json({ message: "Auto texto não encontrado ou não pertence ao usuário!" });
        }

        console.log('Auto texto retornado:', autoText);
        res.status(200).json(autoText);
    } catch (error) {
        console.error('Erro na rota /autotext/by-name:', error);
        res.status(500).json({ message: "Erro ao buscar auto texto" });
    }
});

// Rota para buscar um auto texto por ID
router.get('/autotext/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado!" });
    }

    const autoTextId = req.params.id;
    const userId = req.user._id;

    console.log(`Requisição recebida: autoTextId=${autoTextId}, userId=${userId}`);

    if (!autoTextId || typeof autoTextId !== 'string' || autoTextId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(autoTextId)) {
        return res.status(400).json({ message: "ID inválido" });
    }

    try {
        const autoText = await db.findAutoTextById(autoTextId, userId); // Usando a função do db.js

        if (!autoText) {
            console.log('Auto texto não encontrado');
            return res.status(404).json({ message: "Auto texto não encontrado ou não pertence ao usuário!" });
        }

        console.log('Auto texto retornado:', autoText);
        res.status(200).json(autoText);
    } catch (error) {
        console.error('Erro na rota /autotext/:id:', error);
        res.status(500).json({ message: "Erro ao buscar auto texto" });
    }
});
// Rota para salvar ou editar auto texto
router.post('/autotext', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado!" });
    }

    const { id, name, content } = req.body;
    const userId = req.user._id;

    if (!name || !content) {
        return res.status(400).json({ message: "Nome e conteúdo são obrigatórios!" });
    }

    const autoText = {
        name,
        content,
        userId
    };

    try {
        if (id) {
            const result = await db.updateAutoText(id, autoText, userId);
            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "Auto texto não encontrado ou não pertence ao usuário!" });
            }
            res.status(200).json({ message: "Auto texto editado com sucesso!" });
        } else {
            await db.insertAutoText(autoText);
            res.status(201).json({ message: "Auto texto salvo com sucesso!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao salvar ou editar auto texto" });
    }
});

// Rota para excluir auto texto
router.delete('/autotext/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Usuário não autenticado!" });
    }

    const autoTextId = req.params.id;
    const userId = req.user._id;

    try {
        const result = await db.deleteAutoText(autoTextId, userId);
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Auto texto não encontrado ou não pertence ao usuário!" });
        }
        res.status(200).json({ message: "Auto texto excluído com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao excluir auto texto" });
    }
});

module.exports = router;
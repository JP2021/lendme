const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Enviar mensagem em uma troca
router.post('/trades/:tradeId/messages', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { tradeId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Mensagem não pode estar vazia' });
    }

    // Verifica se o usuário tem acesso a esta troca
    const trade = await db.getTradeById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Troca não encontrada' });
    }

    const fromUserId = trade.fromUserId?.toString() || trade.fromUserId;
    const toUserId = trade.toUserId?.toString() || trade.toUserId;

    if (userId !== fromUserId && userId !== toUserId) {
      return res.status(403).json({ message: 'Você não tem permissão para enviar mensagens nesta troca' });
    }

    const newMessage = await db.createTradeMessage({
      tradeId,
      userId,
      message: message.trim(),
    });

    return res.json({ message: 'Mensagem enviada', data: newMessage });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Listar mensagens de uma troca
router.get('/trades/:tradeId/messages', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { tradeId } = req.params;

    // Verifica se o usuário tem acesso a esta troca
    const trade = await db.getTradeById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Troca não encontrada' });
    }

    const fromUserId = trade.fromUserId?.toString() || trade.fromUserId;
    const toUserId = trade.toUserId?.toString() || trade.toUserId;

    if (userId !== fromUserId && userId !== toUserId) {
      return res.status(403).json({ message: 'Você não tem permissão para ver mensagens desta troca' });
    }

    const messages = await db.getTradeMessages(tradeId);
    return res.json(messages);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    return res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

module.exports = router;


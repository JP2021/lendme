const express = require('express');
const router = express.Router();
const db = require('../db');
const { ObjectId } = require('mongodb');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Criar ou obter conversa entre dois usuários
router.get('/conversations/:userId', ensureApiAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { userId } = req.params;

    if (currentUserId === userId) {
      return res.status(400).json({ message: 'Não é possível criar conversa consigo mesmo' });
    }

    // Verifica se já existe uma conversa
    const conversation = await db.getConversation(currentUserId, userId);
    
    if (!conversation) {
      // Cria nova conversa
      const newConversation = await db.createConversation(currentUserId, userId);
      return res.json(newConversation);
    }

    return res.json(conversation);
  } catch (err) {
    console.error('Erro ao buscar/criar conversa:', err);
    return res.status(500).json({ message: 'Erro ao buscar conversa' });
  }
});

// Listar todas as conversas do usuário
router.get('/conversations', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const conversations = await db.getUserConversations(userId);
    return res.json(conversations);
  } catch (err) {
    console.error('Erro ao listar conversas:', err);
    return res.status(500).json({ message: 'Erro ao listar conversas' });
  }
});

// Enviar mensagem em uma conversa
router.post('/conversations/:conversationId/messages', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Mensagem é obrigatória' });
    }

    // Verifica se a conversa existe e o usuário tem acesso
    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversa não encontrada' });
    }

    const user1Id = conversation.user1Id?.toString() || conversation.user1Id;
    const user2Id = conversation.user2Id?.toString() || conversation.user2Id;

    if (userId !== user1Id && userId !== user2Id) {
      return res.status(403).json({ message: 'Você não tem acesso a esta conversa' });
    }

    const newMessage = await db.createConversationMessage({
      conversationId,
      userId,
      message: message.trim(),
    });

    return res.json(newMessage);
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Listar mensagens de uma conversa
router.get('/conversations/:conversationId/messages', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;

    // Verifica se a conversa existe e o usuário tem acesso
    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversa não encontrada' });
    }

    const user1Id = conversation.user1Id?.toString() || conversation.user1Id;
    const user2Id = conversation.user2Id?.toString() || conversation.user2Id;

    if (userId !== user1Id && userId !== user2Id) {
      return res.status(403).json({ message: 'Você não tem acesso a esta conversa' });
    }

    const messages = await db.getConversationMessages(conversationId);
    return res.json(messages);
  } catch (err) {
    console.error('Erro ao listar mensagens:', err);
    return res.status(500).json({ message: 'Erro ao listar mensagens' });
  }
});

module.exports = router;


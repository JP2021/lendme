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

// Lista de amigos do usuário autenticado
router.get('/friends', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const friends = await db.getFriends(userId);
    return res.json(friends);
  } catch (err) {
    console.error('Erro em /api/friends:', err);
    return res.status(500).json({ message: 'Erro ao buscar amigos' });
  }
});

// Enviar solicitação de amizade
router.post('/friends/request', ensureApiAuthenticated, async (req, res) => {
  try {
    const fromUserId = req.user._id.toString();
    const { toUserId } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: 'ID do usuário é obrigatório' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Não é possível enviar solicitação para si mesmo' });
    }

    // Verifica se já são amigos
    const friends = await db.getFriends(fromUserId);
    const isAlreadyFriend = friends.some(f => {
      const friendId = f._id?.toString() || f._id;
      return friendId === toUserId;
    });
    
    if (isAlreadyFriend) {
      return res.status(400).json({ message: 'Vocês já são amigos' });
    }

    // Verifica se já existe solicitação pendente (em qualquer direção)
    const existingRequestSent = await db.findFriendRequest(fromUserId, toUserId);
    const existingRequestReceived = await db.findFriendRequest(toUserId, fromUserId);
    
    if (existingRequestSent && existingRequestSent.status === 'pending') {
      return res.status(400).json({ message: 'Solicitação já enviada' });
    }
    
    if (existingRequestReceived && existingRequestReceived.status === 'pending') {
      return res.status(400).json({ message: 'Este usuário já enviou uma solicitação para você. Verifique suas solicitações recebidas.' });
    }

    // Cria nova solicitação
    const request = await db.createFriendRequest(fromUserId, toUserId);
    return res.json({ message: 'Solicitação enviada', request });
  } catch (err) {
    console.error('Erro ao enviar solicitação:', err);
    return res.status(500).json({ message: 'Erro ao enviar solicitação' });
  }
});

// Listar solicitações recebidas
router.get('/friends/requests/received', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const requests = await db.getFriendRequests(userId, 'received');
    return res.json(requests);
  } catch (err) {
    console.error('Erro ao buscar solicitações:', err);
    return res.status(500).json({ message: 'Erro ao buscar solicitações' });
  }
});

// Listar solicitações enviadas
router.get('/friends/requests/sent', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const requests = await db.getFriendRequests(userId, 'sent');
    return res.json(requests);
  } catch (err) {
    console.error('Erro ao buscar solicitações:', err);
    return res.status(500).json({ message: 'Erro ao buscar solicitações' });
  }
});

// Aceitar solicitação de amizade
router.post('/friends/requests/:requestId/accept', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { requestId } = req.params;

    const conn = await db.connect();
    const request = await conn.collection("friendRequests").findOne({
      _id: ObjectId.createFromHexString(requestId),
      toUserId: ObjectId.createFromHexString(userId),
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    const fromUserId = request.fromUserId?.toString() || request.fromUserId;
    const toUserId = request.toUserId?.toString() || request.toUserId;

    await db.acceptFriendRequest(requestId, fromUserId, toUserId);
    
    return res.json({ message: 'Solicitação aceita' });
  } catch (err) {
    console.error('Erro ao aceitar solicitação:', err);
    return res.status(500).json({ message: 'Erro ao aceitar solicitação' });
  }
});

// Recusar solicitação de amizade
router.post('/friends/requests/:requestId/reject', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { requestId } = req.params;

    const conn = await db.connect();
    const request = await conn.collection("friendRequests").findOne({
      _id: ObjectId.createFromHexString(requestId),
      toUserId: ObjectId.createFromHexString(userId),
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    await db.rejectFriendRequest(requestId);
    return res.json({ message: 'Solicitação recusada' });
  } catch (err) {
    console.error('Erro ao recusar solicitação:', err);
    return res.status(500).json({ message: 'Erro ao recusar solicitação' });
  }
});

// Remover amigo
router.delete('/friends/:friendId', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { friendId } = req.params;

    await db.removeFriend(userId, friendId);
    return res.json({ message: 'Amigo removido' });
  } catch (err) {
    console.error('Erro ao remover amigo:', err);
    return res.status(500).json({ message: 'Erro ao remover amigo' });
  }
});

// Buscar usuários públicos (para explorar)
router.get('/users/search', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Busca usuários públicos
    const publicUsers = await db.searchPublicUsers(q, userId);
    
    // Busca amigos para verificar quais já são amigos
    const friends = await db.getFriends(userId);
    const friendIds = new Set(friends.map(f => f._id.toString()));
    
    // Adiciona flag se é amigo ou não
    const users = publicUsers.map(user => ({
      ...user,
      isFriend: friendIds.has(user._id.toString())
    }));

    return res.json(users);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    return res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

module.exports = router;

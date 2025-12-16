const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Criar solicitação de troca
router.post('/trades', ensureApiAuthenticated, async (req, res) => {
  try {
    const fromUserId = req.user._id.toString();
    const { toUserId, fromProductId, toProductId } = req.body;

    if (!toUserId || !fromProductId || !toProductId) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Não é possível trocar com si mesmo' });
    }

    // Verifica se os produtos existem
    const fromProduct = await db.getProduct(fromProductId);
    const toProduct = await db.getProduct(toProductId);

    if (!fromProduct || !toProduct) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Verifica se o produto pertence ao usuário
    const fromProductUserId = fromProduct.userId?.toString ? fromProduct.userId.toString() : fromProduct.userId.toString();
    const toProductUserId = toProduct.userId?.toString ? toProduct.userId.toString() : toProduct.userId.toString();
    
    if (fromProductUserId !== fromUserId) {
      return res.status(403).json({ message: 'Produto não pertence a você' });
    }

    if (toProductUserId !== toUserId) {
      return res.status(403).json({ message: 'Produto não pertence ao outro usuário' });
    }

    const trade = await db.createTrade({
      fromUserId,
      toUserId,
      fromProductId,
      toProductId,
    });

    return res.json({ message: 'Solicitação de troca criada', trade });
  } catch (err) {
    console.error('Erro ao criar troca:', err);
    return res.status(500).json({ message: 'Erro ao criar troca' });
  }
});

// Listar trocas do usuário
router.get('/trades', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { status } = req.query;

    let trades = await db.getTrades(userId);

    // getTrades já retorna com IDs convertidos para strings
    if (status) {
      trades = trades.filter(t => t.status === status);
    }

    console.log(`[DEBUG] Trades retornados para usuário ${userId}:`, trades.length);
    trades.forEach((t, idx) => {
      console.log(`[DEBUG] Trade ${idx + 1}:`, {
        _id: t._id,
        fromUserId: t.fromUserId,
        toUserId: t.toUserId,
        status: t.status
      });
    });

    return res.json(trades);
  } catch (err) {
    console.error('Erro ao listar trocas:', err);
    return res.status(500).json({ message: 'Erro ao listar trocas' });
  }
});

// Buscar troca específica
router.get('/trades/:tradeId', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { tradeId } = req.params;

    const trade = await db.getTradeById(tradeId);

    if (!trade) {
      return res.status(404).json({ message: 'Troca não encontrada' });
    }

    // Verifica se o usuário tem acesso a esta troca
    const fromUserId = trade.fromUserId?.toString() || trade.fromUserId;
    const toUserId = trade.toUserId?.toString() || trade.toUserId;

    if (userId !== fromUserId && userId !== toUserId) {
      return res.status(403).json({ message: 'Você não tem permissão para ver esta troca' });
    }

    return res.json(trade);
  } catch (err) {
    console.error('Erro ao buscar troca:', err);
    return res.status(500).json({ message: 'Erro ao buscar troca' });
  }
});

// Aceitar troca
router.post('/trades/:tradeId/accept', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { tradeId } = req.params;

    await db.updateTradeStatus(tradeId, userId, 'accepted');
    return res.json({ message: 'Troca aceita' });
  } catch (err) {
    console.error('Erro ao aceitar troca:', err);
    return res.status(500).json({ message: 'Erro ao aceitar troca' });
  }
});

// Recusar troca
router.post('/trades/:tradeId/reject', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { tradeId } = req.params;

    await db.updateTradeStatus(tradeId, userId, 'rejected');
    return res.json({ message: 'Troca recusada' });
  } catch (err) {
    console.error('Erro ao recusar troca:', err);
    return res.status(500).json({ message: 'Erro ao recusar troca' });
  }
});

// Concluir troca
router.post('/trades/:tradeId/complete', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { tradeId } = req.params;

    // Busca a troca para obter informações dos produtos
    const trade = await db.getTradeById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Troca não encontrada' });
    }

    // Verifica se o usuário tem permissão
    const fromUserId = trade.fromUserId?.toString() || trade.fromUserId;
    const toUserId = trade.toUserId?.toString() || trade.toUserId;
    if (userId !== fromUserId && userId !== toUserId) {
      return res.status(403).json({ message: 'Você não tem permissão para concluir esta troca' });
    }

    // Verifica se a troca está aceita
    if (trade.status !== 'accepted') {
      return res.status(400).json({ message: 'A troca precisa estar aceita para ser concluída' });
    }

    // Atualiza status da troca
    await db.updateTradeStatus(tradeId, userId, 'completed');

    // Troca os donos dos produtos e marca como trocados
    const { ObjectId } = require('mongodb');
    const conn = await db.connect();
    
    // Troca os donos dos produtos:
    // Exemplo: Mauro troca "Câmera" por "Panela" do João
    // - Câmera (fromProduct) era do Mauro, agora é do João
    // - Panela (toProduct) era do João, agora é do Mauro
    
    // O produto do fromUser (que ele DEU) agora pertence ao toUser (que RECEBEU)
    const fromProductUpdate = await conn.collection("products").updateOne(
      { _id: ObjectId.createFromHexString(trade.fromProductId.toString()) },
      { 
        $set: { 
          userId: ObjectId.createFromHexString(trade.toUserId.toString()),
          status: 'traded',
          tradedWith: trade.fromUser?.name || 'Usuário',
          tradedFor: trade.fromProduct?.name || 'Produto',
          tradedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );
    console.log(`[Trade Complete] ${trade.fromProduct?.name || 'Produto'} (${trade.fromProductId}) transferido de ${trade.fromUser?.name || trade.fromUserId} para ${trade.toUser?.name || trade.toUserId}`);
    console.log(`[Trade Complete] Update result:`, fromProductUpdate.modifiedCount, 'documentos modificados');

    // O produto do toUser (que ele DEU) agora pertence ao fromUser (que RECEBEU)
    const toProductUpdate = await conn.collection("products").updateOne(
      { _id: ObjectId.createFromHexString(trade.toProductId.toString()) },
      { 
        $set: { 
          userId: ObjectId.createFromHexString(trade.fromUserId.toString()),
          status: 'traded',
          tradedWith: trade.toUser?.name || 'Usuário',
          tradedFor: trade.toProduct?.name || 'Produto',
          tradedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );
    console.log(`[Trade Complete] ${trade.toProduct?.name || 'Produto'} (${trade.toProductId}) transferido de ${trade.toUser?.name || trade.toUserId} para ${trade.fromUser?.name || trade.fromUserId}`);
    console.log(`[Trade Complete] Update result:`, toProductUpdate.modifiedCount, 'documentos modificados');

    return res.json({ message: 'Troca concluída' });
  } catch (err) {
    console.error('Erro ao concluir troca:', err);
    return res.status(500).json({ message: 'Erro ao concluir troca' });
  }
});

module.exports = router;



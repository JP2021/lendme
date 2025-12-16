const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Criar pedido de empréstimo (no feed)
router.post('/loans/request', ensureApiAuthenticated, async (req, res) => {
  try {
    const requesterId = req.user._id.toString();
    const { itemName } = req.body;

    if (!itemName) {
      return res.status(400).json({ message: 'Nome do item é obrigatório' });
    }

    const loan = await db.createLoanRequest({
      requesterId,
      itemName,
    });

    return res.json({ message: 'Pedido de empréstimo criado', loan });
  } catch (err) {
    console.error('Erro ao criar pedido de empréstimo:', err);
    return res.status(500).json({ message: 'Erro ao criar pedido de empréstimo' });
  }
});

// Listar pedidos de empréstimo
router.get('/loans', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { type } = req.query; // 'received' (pedidos que recebi) ou 'sent' (pedidos que enviei)
    
    const loans = await db.getLoanRequests(userId, type || 'received');
    return res.json(loans);
  } catch (err) {
    console.error('Erro ao listar pedidos de empréstimo:', err);
    return res.status(500).json({ message: 'Erro ao listar pedidos de empréstimo' });
  }
});

// Oferecer produto para empréstimo
router.post('/loans/:loanId/offer', ensureApiAuthenticated, async (req, res) => {
  try {
    const lenderId = req.user._id.toString();
    const { loanId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'ID do produto é obrigatório' });
    }

    // Verifica se o produto existe e pertence ao usuário
    const product = await db.getProduct(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const productUserId = product.userId?.toString ? product.userId.toString() : product.userId.toString();
    if (productUserId !== lenderId) {
      return res.status(403).json({ message: 'Produto não pertence a você' });
    }

    // Verifica se o produto está disponível
    if (product.status !== 'available') {
      return res.status(400).json({ message: 'Este produto não está disponível para empréstimo' });
    }

    // Busca o pedido de empréstimo
    const loan = await db.getLoanById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Pedido de empréstimo não encontrado' });
    }

    // Verifica se o pedido ainda está pendente
    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Este pedido de empréstimo já foi processado' });
    }

    await db.createLoanOffer(loanId, lenderId, productId);

    // Cria notificação para o solicitante
    await db.createNotification({
      userId: loan.requesterId,
      fromUserId: lenderId,
      type: 'loan_offer',
      title: 'Oferta de empréstimo',
      message: `${req.user.name || 'Um usuário'} ofereceu emprestar: ${product.name}`,
      relatedId: loanId,
    });

    return res.json({ message: 'Oferta de empréstimo enviada' });
  } catch (err) {
    console.error('Erro ao oferecer empréstimo:', err);
    return res.status(500).json({ message: 'Erro ao oferecer empréstimo' });
  }
});

// Aceitar oferta de empréstimo
router.post('/loans/:loanId/accept', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { loanId } = req.params;

    const loan = await db.acceptLoan(loanId, userId);
    if (!loan) {
      return res.status(404).json({ message: 'Pedido de empréstimo não encontrado' });
    }

    // Busca o empréstimo atualizado
    const updatedLoan = await db.getLoanById(loanId);
    const product = updatedLoan.product;

    // Cria notificação para o emprestador
    await db.createNotification({
      userId: updatedLoan.lenderId,
      fromUserId: userId,
      type: 'loan_accepted',
      title: 'Oferta de empréstimo aceita',
      message: `${req.user.name || 'Um usuário'} aceitou sua oferta de empréstimo: ${product?.name || updatedLoan.itemName}`,
      relatedId: loanId,
    });

    return res.json({ message: 'Oferta de empréstimo aceita', loan: updatedLoan });
  } catch (err) {
    console.error('Erro ao aceitar empréstimo:', err);
    return res.status(500).json({ message: err.message || 'Erro ao aceitar empréstimo' });
  }
});

// Confirmar recebimento do empréstimo
router.post('/loans/:loanId/confirm-received', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { loanId } = req.params;

    const loan = await db.confirmLoanReceived(loanId, userId);
    if (!loan) {
      return res.status(404).json({ message: 'Pedido de empréstimo não encontrado' });
    }

    // Busca o empréstimo atualizado
    const updatedLoan = await db.getLoanById(loanId);
    const product = updatedLoan.product;

    // Cria notificação para o emprestador
    await db.createNotification({
      userId: updatedLoan.lenderId,
      fromUserId: userId,
      type: 'loan_confirmed',
      title: 'Empréstimo confirmado',
      message: `${req.user.name || 'Um usuário'} confirmou o recebimento de: ${product?.name || updatedLoan.itemName}`,
      relatedId: loanId,
    });

    return res.json({ message: 'Recebimento confirmado', loan: updatedLoan });
  } catch (err) {
    console.error('Erro ao confirmar recebimento:', err);
    return res.status(500).json({ message: err.message || 'Erro ao confirmar recebimento' });
  }
});

// Cancelar pedido de empréstimo
router.post('/loans/:loanId/cancel', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { loanId } = req.params;

    const loan = await db.cancelLoanRequest(loanId, userId);
    if (!loan) {
      return res.status(404).json({ message: 'Pedido de empréstimo não encontrado' });
    }

    return res.json({ message: 'Pedido de empréstimo cancelado' });
  } catch (err) {
    console.error('Erro ao cancelar empréstimo:', err);
    return res.status(500).json({ message: err.message || 'Erro ao cancelar empréstimo' });
  }
});

// Buscar empréstimo por ID
router.get('/loans/:loanId', ensureApiAuthenticated, async (req, res) => {
  try {
    const { loanId } = req.params;
    const loan = await db.getLoanById(loanId);
    
    if (!loan) {
      return res.status(404).json({ message: 'Empréstimo não encontrado' });
    }

    return res.json(loan);
  } catch (err) {
    console.error('Erro ao buscar empréstimo:', err);
    return res.status(500).json({ message: 'Erro ao buscar empréstimo' });
  }
});

// Confirmar empréstimo (requester ou lender)
router.post('/loans/:loanId/confirm', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { loanId } = req.params;
    const { userType } = req.body; // 'requester' ou 'lender'

    if (!userType || (userType !== 'requester' && userType !== 'lender')) {
      return res.status(400).json({ message: 'Tipo de usuário inválido (requester ou lender)' });
    }

    // Busca o empréstimo
    const loans = await db.getLoanRequests(userId, 'received');
    const loan = loans.find(l => l._id === loanId) || 
                 (await db.getLoanRequests(userId, 'sent')).find(l => l._id === loanId);

    if (!loan) {
      return res.status(404).json({ message: 'Pedido de empréstimo não encontrado' });
    }

    // Verifica se o usuário tem permissão
    const isRequester = loan.requesterId === userId;
    const isLender = loan.lenderId === userId;

    if (userType === 'requester' && !isRequester) {
      return res.status(403).json({ message: 'Você não é o solicitante deste empréstimo' });
    }

    if (userType === 'lender' && !isLender) {
      return res.status(403).json({ message: 'Você não é o emprestador deste empréstimo' });
    }

    const updatedLoan = await db.confirmLoan(loanId, userId, userType);

    // Se ambos confirmaram, cria notificações
    if (updatedLoan && updatedLoan.status === 'confirmed') {
      const product = loan.productId ? await db.getProduct(loan.productId) : null;

      // Notificação para o solicitante
      await db.createNotification({
        userId: loan.requesterId,
        fromUserId: loan.lenderId,
        type: 'loan_confirmed',
        title: 'Empréstimo confirmado',
        message: `O empréstimo de ${product?.name || loan.itemName || 'o item'} foi confirmado`,
        relatedId: loanId,
      });

      // Notificação para o emprestador
      await db.createNotification({
        userId: loan.lenderId,
        fromUserId: loan.requesterId,
        type: 'loan_confirmed',
        title: 'Empréstimo confirmado',
        message: `Você emprestou ${product?.name || 'o item'} para ${loan.requester?.name || 'um usuário'}`,
        relatedId: loanId,
      });
    }

    return res.json({ message: 'Empréstimo confirmado', loan: updatedLoan });
  } catch (err) {
    console.error('Erro ao confirmar empréstimo:', err);
    return res.status(500).json({ message: 'Erro ao confirmar empréstimo' });
  }
});

module.exports = router;


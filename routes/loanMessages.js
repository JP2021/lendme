const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Enviar mensagem em um empréstimo
router.post('/loans/:loanId/messages', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { loanId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Mensagem é obrigatória' });
    }

    // Verifica se o empréstimo existe e o usuário tem acesso
    const loan = await db.getLoanById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Empréstimo não encontrado' });
    }

    const loanRequesterId = loan.requesterId?.toString() || loan.requesterId;
    const loanLenderId = loan.lenderId?.toString() || loan.lenderId;

    // Verifica se o usuário está envolvido no empréstimo
    if (userId !== loanRequesterId && userId !== loanLenderId) {
      return res.status(403).json({ message: 'Você não tem acesso a este empréstimo' });
    }

    // Verifica se o empréstimo está aceito ou confirmado (para permitir chat)
    if (loan.status !== 'accepted' && loan.status !== 'confirmed') {
      return res.status(400).json({ message: 'A conversa só está disponível após o empréstimo ser aceito' });
    }

    const newMessage = await db.createLoanMessage({
      loanId,
      userId,
      message: message.trim(),
    });

    return res.json(newMessage);
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Listar mensagens de um empréstimo
router.get('/loans/:loanId/messages', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { loanId } = req.params;

    // Verifica se o empréstimo existe e o usuário tem acesso
    const loan = await db.getLoanById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Empréstimo não encontrado' });
    }

    const loanRequesterId = loan.requesterId?.toString() || loan.requesterId;
    const loanLenderId = loan.lenderId?.toString() || loan.lenderId;

    // Verifica se o usuário está envolvido no empréstimo
    if (userId !== loanRequesterId && userId !== loanLenderId) {
      return res.status(403).json({ message: 'Você não tem acesso a este empréstimo' });
    }

    const messages = await db.getLoanMessages(loanId);
    return res.json(messages);
  } catch (err) {
    console.error('Erro ao listar mensagens:', err);
    return res.status(500).json({ message: 'Erro ao listar mensagens' });
  }
});

module.exports = router;


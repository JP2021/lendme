const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Enviar mensagem em uma doação
router.post('/donations/:donationId/messages', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { donationId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Mensagem não pode estar vazia' });
    }

    // Busca a doação para verificar permissões
    const donations = await db.getDonationRequests(userId, 'received');
    const donation = donations.find(d => d._id === donationId) || 
                     (await db.getDonationRequests(userId, 'sent')).find(d => d._id === donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Doação não encontrada' });
    }

    // Verifica se o usuário tem acesso (é o dono do produto ou quem recebeu)
    const donationToUserId = donation.toUserId?.toString() || donation.toUserId;
    const donationFromUserId = donation.fromUserId?.toString() || donation.fromUserId;

    if (userId !== donationToUserId && userId !== donationFromUserId) {
      return res.status(403).json({ message: 'Você não tem permissão para enviar mensagens nesta doação' });
    }

    // Verifica se a doação está aceita (só permite mensagens após aceitação)
    if (donation.status !== 'accepted' && donation.status !== 'confirmed') {
      return res.status(400).json({ message: 'A doação precisa estar aceita para enviar mensagens' });
    }

    const newMessage = await db.createDonationMessage({
      donationId,
      userId,
      message: message.trim(),
    });

    return res.json({ message: 'Mensagem enviada', data: newMessage });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// Listar mensagens de uma doação
router.get('/donations/:donationId/messages', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { donationId } = req.params;

    // Busca a doação para verificar permissões
    const donations = await db.getDonationRequests(userId, 'received');
    const donation = donations.find(d => d._id === donationId) || 
                     (await db.getDonationRequests(userId, 'sent')).find(d => d._id === donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Doação não encontrada' });
    }

    // Verifica se o usuário tem acesso
    const donationToUserId = donation.toUserId?.toString() || donation.toUserId;
    const donationFromUserId = donation.fromUserId?.toString() || donation.fromUserId;

    if (userId !== donationToUserId && userId !== donationFromUserId) {
      return res.status(403).json({ message: 'Você não tem permissão para ver mensagens desta doação' });
    }

    const messages = await db.getDonationMessages(donationId);
    return res.json(messages);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    return res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

module.exports = router;


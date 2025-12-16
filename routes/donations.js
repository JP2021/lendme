const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Criar solicitação de doação
router.post('/donations', ensureApiAuthenticated, async (req, res) => {
  try {
    const fromUserId = req.user._id.toString();
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'ID do produto é obrigatório' });
    }

    // Verifica se o produto existe
    const product = await db.getProduct(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const productUserId = product.userId?.toString ? product.userId.toString() : product.userId.toString();
    
    // Verifica se o produto não pertence ao usuário
    if (productUserId === fromUserId) {
      return res.status(400).json({ message: 'Você não pode solicitar doação do seu próprio produto' });
    }

    // Verifica se o produto está disponível para doação
    if (product.status !== 'available' || product.type !== 'donation') {
      return res.status(400).json({ message: 'Este produto não está disponível para doação' });
    }

    // Verifica se já existe uma doação aceita para este produto
    const acceptedDonations = await db.getDonationRequests(productUserId, 'received');
    const productIdStr = String(productId);
    const hasAcceptedDonation = acceptedDonations.some(d => {
      const dProductIdStr = String(d.productId || '');
      return dProductIdStr === productIdStr && d.status === 'accepted';
    });

    if (hasAcceptedDonation) {
      return res.status(400).json({ message: 'Este produto já tem uma doação aceita em andamento' });
    }

    // Verifica se já existe solicitação pendente do mesmo usuário
    const existingRequests = await db.getDonationRequests(productUserId, 'received');
    const hasExistingRequest = existingRequests.some(req => 
      req.fromUserId === fromUserId && req.status === 'pending'
    );

    if (hasExistingRequest) {
      return res.status(400).json({ message: 'Você já solicitou esta doação' });
    }

    // Verifica se já atingiu o limite de 10 solicitações
    const requestCount = await db.getDonationRequestCount(productId);
    if (requestCount >= 10) {
      return res.status(400).json({ message: 'Este produto já recebeu o máximo de solicitações de doação' });
    }

    console.log('[DEBUG Donation] Criando solicitação de doação:', {
      fromUserId,
      toUserId: productUserId,
      productId,
      productName: product.name
    });

    const donation = await db.createDonationRequest({
      fromUserId,
      toUserId: productUserId,
      productId,
    });

    console.log('[DEBUG Donation] Doação criada com ID:', donation.insertedId.toString());

    // Cria notificação para o dono do produto
    await db.createNotification({
      userId: productUserId,
      fromUserId,
      type: 'donation_request',
      title: 'Nova solicitação de doação',
      message: `${req.user.name || 'Um usuário'} quer receber sua doação: ${product.name}`,
      relatedId: donation.insertedId.toString(),
    });

    // Busca a doação criada com informações populadas
    const donations = await db.getDonationRequests(productUserId, 'received');
    const createdDonation = donations.find(d => d._id === donation.insertedId.toString());

    return res.json({ message: 'Solicitação de doação criada', donation: createdDonation || donation });
  } catch (err) {
    console.error('Erro ao criar solicitação de doação:', err);
    return res.status(500).json({ message: 'Erro ao criar solicitação de doação' });
  }
});

// Contar doações pendentes do usuário
router.get('/donations/pending-count', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const donations = await db.getDonationRequests(userId, 'received');
    const pendingCount = donations.filter(d => d.status === 'pending').length;
    return res.json({ count: pendingCount });
  } catch (err) {
    console.error('Erro ao contar doações pendentes:', err);
    return res.status(500).json({ message: 'Erro ao contar doações pendentes' });
  }
});

// Listar solicitações de doação
router.get('/donations', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { type } = req.query; // 'received' ou 'sent'
    
    console.log('[DEBUG Donation] Buscando doações para usuário:', userId, 'tipo:', type || 'received');
    
    const donations = await db.getDonationRequests(userId, type || 'received');
    
    console.log('[DEBUG Donation] Doações encontradas:', donations.length);
    donations.forEach((d, idx) => {
      console.log(`[DEBUG Donation] Doação ${idx + 1}:`, {
        _id: d._id,
        fromUserId: d.fromUserId,
        toUserId: d.toUserId,
        status: d.status,
        productId: d.productId,
        fromUser: d.fromUser?.name,
        product: d.product?.name
      });
    });
    
    return res.json(donations);
  } catch (err) {
    console.error('Erro ao listar solicitações de doação:', err);
    return res.status(500).json({ message: 'Erro ao listar solicitações de doação' });
  }
});

// Buscar doação específica
router.get('/donations/:donationId', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { donationId } = req.params;
    
    const donation = await db.getDonationById(donationId);
    
    if (!donation) {
      return res.status(404).json({ message: 'Doação não encontrada' });
    }
    
    // Verifica se o usuário tem acesso (é o dono do produto ou quem recebeu)
    const donationToUserId = donation.toUserId?.toString() || donation.toUserId;
    const donationFromUserId = donation.fromUserId?.toString() || donation.fromUserId;
    
    if (userId !== donationToUserId && userId !== donationFromUserId) {
      return res.status(403).json({ message: 'Você não tem permissão para ver esta doação' });
    }
    
    return res.json(donation);
  } catch (err) {
    console.error('Erro ao buscar doação:', err);
    return res.status(500).json({ message: 'Erro ao buscar doação' });
  }
});

// Aceitar doação
router.post('/donations/:donationId/accept', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { donationId } = req.params;

    // Busca a doação primeiro para verificar permissões
    const donations = await db.getDonationRequests(userId, 'received');
    const donation = donations.find(d => d._id === donationId);
    
    if (!donation) {
      return res.status(404).json({ message: 'Solicitação de doação não encontrada' });
    }

    // Verifica se o usuário é o dono do produto
    const product = await db.getProduct(donation.productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    
    const productUserId = product.userId?.toString ? product.userId.toString() : product.userId.toString();
    
    if (productUserId !== userId) {
      return res.status(403).json({ message: 'Você não tem permissão para aceitar esta doação' });
    }

    // Aceita a doação (status: accepted, aguardando confirmação de recebimento)
    await db.acceptDonation(donationId, userId);

    // Cria mensagem inicial automática
    await db.createDonationMessage({
      donationId,
      userId: userId,
      message: `Olá! Aceitei sua solicitação de doação. Vamos combinar os detalhes da entrega?`
    });

    // Cria notificações
    await db.createNotification({
      userId: donation.fromUserId.toString(),
      fromUserId: userId,
      type: 'donation_accepted',
      title: 'Doação aceita',
      message: `${req.user.name || 'O dono'} aceitou sua solicitação de doação: ${product.name}. Entre na conversa para combinar os detalhes!`,
      relatedId: donationId,
    });

    return res.json({ message: 'Doação aceita. Uma conversa foi iniciada para combinar os detalhes.' });
  } catch (err) {
    console.error('Erro ao aceitar doação:', err);
    return res.status(500).json({ message: 'Erro ao aceitar doação' });
  }
});

// Confirmar recebimento da doação (apenas quem recebeu pode confirmar)
router.post('/donations/:donationId/confirm-received', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { donationId } = req.params;

    // Busca a doação
    const donations = await db.getDonationRequests(userId, 'sent');
    const donation = donations.find(d => d._id === donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Doação não encontrada' });
    }

    // Verifica se a doação está aceita
    if (donation.status !== 'accepted') {
      return res.status(400).json({ message: 'A doação precisa estar aceita para confirmar recebimento' });
    }

    // Verifica se o usuário é quem recebeu a doação (fromUserId)
    const donationFromUserId = donation.fromUserId?.toString() || donation.fromUserId;
    if (donationFromUserId !== userId) {
      return res.status(403).json({ message: 'Apenas quem recebeu a doação pode confirmar o recebimento' });
    }

    // Confirma o recebimento
    await db.confirmDonationReceived(donationId, userId);

    const product = await db.getProduct(donation.productId);

    // Cria notificações
    await db.createNotification({
      userId: donation.toUserId.toString(),
      fromUserId: userId,
      type: 'donation_confirmed',
      title: 'Doação confirmada',
      message: `${donation.fromUser?.name || 'O receptor'} confirmou o recebimento de ${product?.name || 'o produto'}`,
      relatedId: donationId,
    });

    await db.createNotification({
      userId: userId,
      fromUserId: donation.toUserId.toString(),
      type: 'donation_received',
      title: 'Recebimento confirmado',
      message: `Você confirmou o recebimento de ${product?.name || 'o produto'}. Obrigado!`,
      relatedId: donationId,
    });

    return res.json({ message: 'Recebimento confirmado com sucesso!' });
  } catch (err) {
    console.error('Erro ao confirmar recebimento:', err);
    return res.status(500).json({ message: err.message || 'Erro ao confirmar recebimento' });
  }
});

module.exports = router;


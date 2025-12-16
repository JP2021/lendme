const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { ObjectId } = require('mongodb');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas'));
  }
});

// Criar produto
router.post('/products', ensureApiAuthenticated, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { name, description, category, condition } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Nome do produto é obrigatório' });
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const productResult = await db.createProduct({
      userId,
      name,
      description: description || '',
      category: category || 'Outros',
      condition: condition || 'good',
      images,
    });

    // Busca o produto criado com informações do usuário
    const createdProduct = await db.getProduct(productResult.insertedId.toString());

    return res.json({ message: 'Produto criado', product: createdProduct });
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    return res.status(500).json({ message: 'Erro ao criar produto' });
  }
});

// Listar produtos (feed)
router.get('/products', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { category, search, limit } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);

    // Busca produtos de amigos
    const friends = await db.getFriends(userId);
    const friendIds = friends.map(f => {
      const fid = f._id;
      return fid?.toString ? fid.toString() : fid;
    });
    
    // Busca todos os produtos disponíveis
    const allProducts = await db.getProducts(null, filters);
    console.log(`[Feed] Total de produtos no banco: ${allProducts.length}`);
    
    // Busca trocas aceitas para excluir produtos envolvidos (mas não os trocados)
    const allTrades = await db.getTrades(userId);
    const acceptedTrades = allTrades.filter(t => t.status === 'accepted');
    const productIdsInAcceptedTrades = new Set();
    acceptedTrades.forEach(t => {
      if (t.fromProductId) productIdsInAcceptedTrades.add(t.fromProductId.toString());
      if (t.toProductId) productIdsInAcceptedTrades.add(t.toProductId.toString());
    });
    console.log(`[Feed] Produtos em trocas aceitas: ${productIdsInAcceptedTrades.size}`);
    
    // Filtra produtos: próprios produtos, produtos de amigos ou usuários públicos
    // Por padrão, mostra TODOS os produtos públicos para permitir interação
    // EXCETO produtos que estão em trocas aceitas (status: available apenas)
    // INCLUI produtos trocados (status: traded) para mostrar histórico
    const userIdStr = userId.toString();
    
    const visibleProducts = allProducts.filter(p => {
      if (!p || !p.userId) {
        console.log('[Feed] Produto sem userId:', p?._id);
        return false;
      }
      
      const productUserId = p.userId?.toString ? p.userId.toString() : String(p.userId);
      const productId = p._id?.toString ? p._id.toString() : String(p._id);
      
      // INCLUI produtos trocados (devem aparecer no feed com status especial)
      if (p.status === 'traded') {
        return true;
      }
      
      // Exclui produtos que estão em trocas aceitas (mas não os trocados)
      if (productIdsInAcceptedTrades.has(productId) && p.status === 'available') {
        return false;
      }
      
      // Inclui produtos do próprio usuário (mesmo que estejam em trocas aceitas, para ver histórico)
      if (productUserId === userIdStr) {
        return true;
      }
      
      // Inclui produtos de amigos
      const isFriend = friendIds.some(fidStr => {
        const fidStrNormalized = typeof fidStr === 'string' ? fidStr : (fidStr?.toString ? fidStr.toString() : String(fidStr));
        return fidStrNormalized === productUserId;
      });
      if (isFriend) {
        return true;
      }
      
      // Inclui produtos de usuários públicos
      // Por padrão, assume que usuários são públicos (compatibilidade)
      // Isso permite que novos usuários vejam produtos e possam interagir
      const productUser = p.user;
      if (productUser) {
        // Se isPublic é true ou não está definido, mostra o produto
        if (productUser.isPublic !== false) {
          return true;
        }
      } else {
        // Se não conseguiu buscar o usuário, assume público para não bloquear
        // Isso garante que produtos apareçam mesmo se houver problema na busca do usuário
        console.log(`[Feed] Produto ${p._id} sem user, assumindo público`);
        return true;
      }
      
      return false;
    });

    console.log(`[Feed] Produtos visíveis: ${visibleProducts.length} de ${allProducts.length} para usuário ${userIdStr}`);
    console.log(`[Feed] Amigos: ${friendIds.length}`);
    return res.json(visibleProducts);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    return res.status(500).json({ message: 'Erro ao listar produtos' });
  }
});

// Listar produtos do usuário
router.get('/products/my', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    // getProducts busca produtos onde userId = userId do usuário
    // Quando uma troca é concluída, os produtos trocam de dono:
    // - O produto que o usuário DEU não aparece mais (userId mudou)
    // - O produto que o usuário RECEBEU aparece (userId agora é dele)
    const products = await db.getProducts(userId);
    console.log(`[My Products] Usuário ${userId} tem ${products.length} produtos`);
    products.forEach(p => {
      console.log(`[My Products] - ${p.name} (${p._id}), status: ${p.status}, userId: ${p.userId}`);
    });
    return res.json(products);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    return res.status(500).json({ message: 'Erro ao listar produtos' });
  }
});

// Buscar produto específico
router.get('/products/:productId', ensureApiAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await db.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    return res.json(product);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    return res.status(500).json({ message: 'Erro ao buscar produto' });
  }
});

// Atualizar produto
router.put('/products/:productId', ensureApiAuthenticated, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;
    const { name, description, category, condition, existingImages } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category) updates.category = category;
    if (condition) updates.condition = condition;

    // Gerencia imagens: preserva existentes e adiciona novas
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      // Se há imagens existentes no body, preserva elas e adiciona novas
      if (existingImages) {
        try {
          const parsed = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
          updates.images = Array.isArray(parsed) ? [...parsed, ...newImages] : newImages;
        } catch {
          updates.images = newImages;
        }
      } else {
        updates.images = newImages;
      }
    } else if (existingImages) {
      // Se não há novas imagens mas há existentes, preserva as existentes
      try {
        const parsed = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        if (Array.isArray(parsed) && parsed.length > 0) {
          updates.images = parsed;
        }
      } catch {
        // Ignora se não conseguir parsear
      }
    }

    await db.updateProduct(productId, userId, updates);
    const product = await db.getProduct(productId);
    
    return res.json({ message: 'Produto atualizado', product });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    return res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
});

// Deletar produto
router.delete('/products/:productId', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;

    await db.deleteProduct(productId, userId);
    return res.json({ message: 'Produto deletado' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    return res.status(500).json({ message: 'Erro ao deletar produto' });
  }
});

module.exports = router;



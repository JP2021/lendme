const { ObjectId, MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const PAGE_SIZE = 20;

let connection = null;

async function connect() {
    if (connection) return connection;

    const client = new MongoClient(process.env.MONGODB_CONNECTION);

    try {
        await client.connect();
        connection = client.db(process.env.MONGODB_DATABASE);
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        connection = null;
    }

    return connection;
}

// Funções relacionadas aos clientes (customers)

async function countCustomers() {
    const conn = await connect();
    return conn.collection("customers").countDocuments();
}

async function findCustomers(page = 1) {
    const totalSkip = (page - 1) * PAGE_SIZE;
    const conn = await connect();
    return conn
        .collection("customers")
        .find({})
        .skip(totalSkip)
        .limit(PAGE_SIZE)
        .toArray();
}

async function findCustomer(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("customers").findOne({ _id: objectId });
}

async function insertCustomer(customer) {
    const conn = await connect();
    return conn.collection("customers").insertOne(customer);
}

async function updateCustomer(id, customer) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("customers").updateOne({ _id: objectId }, { $set: customer });
}

async function deleteCustomer(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("customers").deleteOne({ _id: objectId });
}

async function searchCustomersByName(name) {
    const conn = await connect();
    return conn
        .collection("customers")
        .find({ name: new RegExp(name, 'i') })
        .toArray();
}

// Funções relacionadas aos pedidos (os)

async function countOs() {
    const conn = await connect();
    return conn.collection("os").countDocuments();
}

async function findOss(page = 1) {
    const totalSkip = (page - 1) * PAGE_SIZE;
    const conn = await connect();
    return conn
        .collection("os")
        .find({})
        .skip(totalSkip)
        .limit(PAGE_SIZE)
        .toArray();
}

async function findOs(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("os").findOne({ _id: objectId });
}

async function insertOs(os) {
    const conn = await connect();
    return conn.collection("os").insertOne(os);
}

async function updateOs(id, os) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("os").updateOne({ _id: objectId }, { $set: os });
}

async function deleteOs(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("os").deleteOne({ _id: objectId });
}
async function searchOSByName(name) {
    const conn = await connect();
    return conn
        .collection("os")
        .find({ name: new RegExp(name, 'i') })
        .toArray();
}
// Funções relacionadas aos usuários (users)

async function countUsers() {
    const conn = await connect();
    return conn.collection("users").countDocuments();
}

async function findUsers(page = 1) {
    const totalSkip = (page - 1) * PAGE_SIZE;
    const conn = await connect();
    return conn
        .collection("users")
        .find({})
        .skip(totalSkip)
        .limit(PAGE_SIZE)
        .toArray();
}

async function findUser(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("users").findOne({ _id: objectId });
}

async function insertUser(user) {
    user.password = bcrypt.hashSync(user.password, 12);
    const conn = await connect();
    return conn.collection("users").insertOne(user);
}

async function updateUser(id, user) {
    if (user.password)
        user.password = bcrypt.hashSync(user.password, 12);

    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("users").updateOne({ _id: objectId }, { $set: user });
}

async function deleteUser(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("users").deleteOne({ _id: objectId });
}

// Exemplo de funções no db

async function insertAutoText(autoText) {
    const connection = await connect();
    return connection.collection("autotexts").insertOne(autoText);
  }
  
  async function updateAutoText(id, autoText, userId) {
    const connection = await connect();
    return connection.collection("autotexts").updateOne(
      { _id: new ObjectId(id), userId: userId },
      { $set: autoText }
    );
  }
  
  async function deleteAutoText(id, userId) {
    const connection = await connect();
    return connection.collection("autotexts").deleteOne({ _id: new ObjectId(id), userId: userId });
  }
  async function findAutoTextsByUserId(userId) {
    const connection = await connect();
    return connection.collection("autotexts").find({ userId: userId }).toArray();
}

async function findAutoTextById(id, userId) {
    try {
        console.log(`Buscando auto texto pelo ID: ${id}, userId: ${userId}`); // Log para depuração

        // Valida se o ID é uma string válida de 24 caracteres hexadecimais
        if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
            throw new Error('ID inválido');
        }

        // Conecta ao banco de dados
        const connection = await connect();

        // Converte o ID para ObjectId
        const objectId = new ObjectId(id);

        // Busca o auto texto pelo ID e pelo ID do usuário
        const autoText = await connection.collection('autotexts').findOne({
            _id: objectId,
            userId: userId
        });

        console.log('Auto texto encontrado:', autoText); // Log para depuração
        return autoText;
    } catch (error) {
        console.error('Erro na função findAutoTextById:', error); // Log para depuração
        throw error;
    }
}

async function findAutoTextByName(name, userId) {
    try {
        const db = await connect(); // Conecta ao banco de dados
        const autoText = await db.collection('autotexts').findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }, // Busca insensível a maiúsculas/minúsculas
            userId: userId // Garante que o auto texto pertence ao usuário
        });
        return autoText;
    } catch (error) {
        console.error('Erro na função findAutoTextByName:', error);
        throw error;
    }
}

// ======= Funções relacionadas a convites (invites) =======

async function createInvite(invite) {
    const conn = await connect();
    return conn.collection("invites").insertOne({
        ...invite,
        createdAt: new Date(),
        used: false,
    });
}

async function findInviteByCode(code) {
    const conn = await connect();
    return conn.collection("invites").findOne({ code });
}

async function markInviteUsed(code, usedByUserId) {
    const conn = await connect();
    return conn.collection("invites").updateOne(
        { code },
        { $set: { used: true, usedAt: new Date(), usedByUserId } }
    );
}

async function findInvitesByUser(fromUserId) {
    const conn = await connect();
    return conn
        .collection("invites")
        .find({ fromUserId })
        .sort({ createdAt: -1 })
        .toArray();
}

// ======= Funções relacionadas a amigos (friends) =======

async function addFriendRelation(userId1, userId2) {
    const conn = await connect();
    const users = conn.collection("users");

    const id1 = ObjectId.createFromHexString(userId1.toString());
    const id2 = ObjectId.createFromHexString(userId2.toString());

    await users.updateOne(
        { _id: id1 },
        { $addToSet: { friends: id2 } }
    );

    await users.updateOne(
        { _id: id2 },
        { $addToSet: { friends: id1 } }
    );
}

async function getFriends(userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    const user = await conn.collection("users").findOne({ _id: id });
    if (!user || !user.friends || user.friends.length === 0) return [];

    return conn
        .collection("users")
        .find({ _id: { $in: user.friends } })
        .project({ password: 0 })
        .toArray();
}

// ======= Funções relacionadas a solicitações de amizade (friendRequests) =======

async function createFriendRequest(fromUserId, toUserId) {
    const conn = await connect();
    return conn.collection("friendRequests").insertOne({
        fromUserId: ObjectId.createFromHexString(fromUserId.toString()),
        toUserId: ObjectId.createFromHexString(toUserId.toString()),
        status: 'pending',
        createdAt: new Date(),
    });
}

async function findFriendRequest(fromUserId, toUserId) {
    const conn = await connect();
    return conn.collection("friendRequests").findOne({
        $or: [
            { fromUserId: ObjectId.createFromHexString(fromUserId.toString()), toUserId: ObjectId.createFromHexString(toUserId.toString()) },
            { fromUserId: ObjectId.createFromHexString(toUserId.toString()), toUserId: ObjectId.createFromHexString(fromUserId.toString()) }
        ]
    });
}

async function getFriendRequests(userId, type = 'received') {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    
    // Query correta: para 'received', busca onde toUserId é o usuário atual
    // Para 'sent', busca onde fromUserId é o usuário atual
    const query = type === 'received' 
        ? { toUserId: id, status: 'pending' }
        : { fromUserId: id, status: 'pending' };
    
    console.log(`[DEBUG DB] getFriendRequests - userId: ${userId}, type: ${type}, query:`, JSON.stringify(query));
    
    const requests = await conn.collection("friendRequests")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    
    console.log(`[DEBUG DB] Encontradas ${requests.length} solicitações`);
    
    // Popula informações dos usuários
    // Para 'received': mostra quem enviou (fromUserId)
    // Para 'sent': mostra quem recebeu (toUserId)
    const userIds = requests.map(r => {
        if (type === 'received') {
            // Solicitações recebidas: queremos o usuário que enviou (fromUserId)
            return r.fromUserId;
        } else {
            // Solicitações enviadas: queremos o usuário que recebeu (toUserId)
            return r.toUserId;
        }
    });
    
    // Remove duplicatas e nulls
    const uniqueUserIds = [...new Set(userIds.filter(id => id))];
    
    const users = uniqueUserIds.length > 0 
        ? await conn.collection("users")
            .find({ _id: { $in: uniqueUserIds } })
            .project({ password: 0 })
            .toArray()
        : [];
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    const result = requests.map(req => {
        const user = type === 'received' 
            ? userMap.get(req.fromUserId?.toString()) 
            : userMap.get(req.toUserId?.toString());
        
        const reqResult = {
            ...req,
            fromUserId: req.fromUserId?.toString(),
            toUserId: req.toUserId?.toString(),
            fromUser: type === 'sent' ? user : undefined,
            toUser: type === 'received' ? user : undefined,
            user: user // Mantém compatibilidade com código existente
        };
        
        console.log(`[DEBUG DB] Solicitação processada:`, {
            _id: reqResult._id?.toString(),
            fromUserId: reqResult.fromUserId,
            toUserId: reqResult.toUserId,
            type: type,
            hasUser: !!user
        });
        
        return reqResult;
    });
    
    return result;
}

async function acceptFriendRequest(requestId, fromUserId, toUserId) {
    const conn = await connect();
    
    // Atualiza status da solicitação
    await conn.collection("friendRequests").updateOne(
        { _id: ObjectId.createFromHexString(requestId.toString()) },
        { $set: { status: 'accepted', acceptedAt: new Date() } }
    );
    
    // Cria relação de amizade mútua
    await addFriendRelation(fromUserId, toUserId);
}

async function rejectFriendRequest(requestId) {
    const conn = await connect();
    return conn.collection("friendRequests").updateOne(
        { _id: ObjectId.createFromHexString(requestId.toString()) },
        { $set: { status: 'rejected', rejectedAt: new Date() } }
    );
}

async function removeFriend(userId1, userId2) {
    const conn = await connect();
    const users = conn.collection("users");
    
    const id1 = ObjectId.createFromHexString(userId1.toString());
    const id2 = ObjectId.createFromHexString(userId2.toString());
    
    await users.updateOne({ _id: id1 }, { $pull: { friends: id2 } });
    await users.updateOne({ _id: id2 }, { $pull: { friends: id1 } });
}

// ======= Funções relacionadas a produtos (products) =======

async function createProduct(product) {
    const conn = await connect();
    return conn.collection("products").insertOne({
        ...product,
        userId: ObjectId.createFromHexString(product.userId.toString()),
        createdAt: new Date(),
        status: 'available',
    });
}

async function getProducts(userId = null, filters = {}) {
    const conn = await connect();
    
    // Constrói a query base
    const query = {};
    
    // Se tem userId, filtra por userId E status (available ou traded)
    if (userId) {
        query.userId = ObjectId.createFromHexString(userId.toString());
        query.$or = [
            { status: 'available' },
            { status: 'traded' }
        ];
    } else {
        // Se não tem userId, busca todos os produtos disponíveis ou trocados
        query.$or = [
            { status: 'available' },
            { status: 'traded' }
        ];
    }
    
    if (filters.category) {
        query.category = filters.category;
    }
    
    if (filters.search) {
        // Combina busca de texto com status e userId
        const searchQuery = {
            $or: [
                { name: new RegExp(filters.search, 'i') },
                { description: new RegExp(filters.search, 'i') }
            ]
        };
        
        // Se já tem $or para status, usa $and para combinar
        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                searchQuery
            ];
            delete query.$or;
        } else {
            Object.assign(query, searchQuery);
        }
    }
    
    console.log(`[getProducts] Query:`, JSON.stringify(query, null, 2));
    
    const products = await conn.collection("products")
        .find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .toArray();
    
    console.log(`[getProducts] Encontrados ${products.length} produtos para userId: ${userId || 'todos'}`);
    
    // Popula informações dos usuários
    const userIds = [...new Set(products.map(p => p.userId.toString()))];
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds.map(id => ObjectId.createFromHexString(id)) } })
        .project({ password: 0 })
        .toArray();
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return products.map(product => ({
        ...product,
        user: userMap.get(product.userId.toString())
    }));
}

async function getProduct(productId) {
    const conn = await connect();
    const product = await conn.collection("products").findOne({
        _id: ObjectId.createFromHexString(productId.toString())
    });
    
    if (!product) return null;
    
    const user = await conn.collection("users").findOne(
        { _id: product.userId },
        { projection: { password: 0 } }
    );
    
    return { ...product, user };
}

async function updateProduct(productId, userId, updates) {
    const conn = await connect();
    return conn.collection("products").updateOne(
        { _id: ObjectId.createFromHexString(productId.toString()), userId: ObjectId.createFromHexString(userId.toString()) },
        { $set: { ...updates, updatedAt: new Date() } }
    );
}

async function deleteProduct(productId, userId) {
    const conn = await connect();
    return conn.collection("products").deleteOne({
        _id: ObjectId.createFromHexString(productId.toString()),
        userId: ObjectId.createFromHexString(userId.toString())
    });
}

// ======= Funções relacionadas a trocas (trades) =======

async function createTrade(trade) {
    const conn = await connect();
    return conn.collection("trades").insertOne({
        ...trade,
        fromUserId: ObjectId.createFromHexString(trade.fromUserId.toString()),
        toUserId: ObjectId.createFromHexString(trade.toUserId.toString()),
        fromProductId: ObjectId.createFromHexString(trade.fromProductId.toString()),
        toProductId: ObjectId.createFromHexString(trade.toProductId.toString()),
        status: 'pending',
        createdAt: new Date(),
    });
}

async function getTrades(userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    
    const trades = await conn.collection("trades")
        .find({
            $or: [
                { fromUserId: id },
                { toUserId: id }
            ]
        })
        .sort({ createdAt: -1 })
        .toArray();
    
    // Popula produtos e usuários
    const productIds = [...new Set([...trades.map(t => t.fromProductId), ...trades.map(t => t.toProductId)])];
    const userIds = [...new Set([...trades.map(t => t.fromUserId), ...trades.map(t => t.toUserId)])];
    
    const products = await conn.collection("products")
        .find({ _id: { $in: productIds } })
        .toArray();
    
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ password: 0 })
        .toArray();
    
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return trades.map(trade => ({
        ...trade,
        _id: trade._id?.toString(),
        fromUserId: trade.fromUserId?.toString(),
        toUserId: trade.toUserId?.toString(),
        fromProductId: trade.fromProductId?.toString(),
        toProductId: trade.toProductId?.toString(),
        fromProduct: productMap.get(trade.fromProductId.toString()),
        toProduct: productMap.get(trade.toProductId.toString()),
        fromUser: userMap.get(trade.fromUserId.toString()),
        toUser: userMap.get(trade.toUserId.toString()),
    }));
}

async function getTradeById(tradeId) {
    const conn = await connect();
    const trade = await conn.collection("trades").findOne({
        _id: ObjectId.createFromHexString(tradeId.toString())
    });
    
    if (!trade) return null;
    
    // Popula produtos e usuários
    const fromProduct = await conn.collection("products").findOne({ _id: trade.fromProductId });
    const toProduct = await conn.collection("products").findOne({ _id: trade.toProductId });
    const fromUser = await conn.collection("users").findOne({ _id: trade.fromUserId }, { projection: { password: 0 } });
    const toUser = await conn.collection("users").findOne({ _id: trade.toUserId }, { projection: { password: 0 } });
    
    return {
        ...trade,
        _id: trade._id?.toString(),
        fromUserId: trade.fromUserId?.toString(),
        toUserId: trade.toUserId?.toString(),
        fromProductId: trade.fromProductId?.toString(),
        toProductId: trade.toProductId?.toString(),
        fromProduct,
        toProduct,
        fromUser,
        toUser,
    };
}

// Funções de mensagens de troca
async function createTradeMessage(messageData) {
    const conn = await connect();
    const result = await conn.collection("tradeMessages").insertOne({
        tradeId: ObjectId.createFromHexString(messageData.tradeId.toString()),
        userId: ObjectId.createFromHexString(messageData.userId.toString()),
        message: messageData.message,
        createdAt: new Date(),
    });
    
    // Busca a mensagem criada com informações do usuário
    const message = await conn.collection("tradeMessages").findOne({ _id: result.insertedId });
    const user = await conn.collection("users").findOne({ _id: message.userId }, { projection: { password: 0 } });
    
    return {
        ...message,
        _id: message._id?.toString(),
        tradeId: message.tradeId?.toString(),
        userId: message.userId?.toString(),
        user,
    };
}

async function getTradeMessages(tradeId) {
    const conn = await connect();
    const messages = await conn.collection("tradeMessages")
        .find({ tradeId: ObjectId.createFromHexString(tradeId.toString()) })
        .sort({ createdAt: 1 })
        .toArray();
    
    // Popula informações dos usuários
    const userIds = [...new Set(messages.map(m => m.userId))];
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ password: 0 })
        .toArray();
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return messages.map(msg => ({
        ...msg,
        _id: msg._id?.toString(),
        tradeId: msg.tradeId?.toString(),
        userId: msg.userId?.toString(),
        user: userMap.get(msg.userId.toString()),
    }));
}

async function updateTradeStatus(tradeId, userId, status) {
    const conn = await connect();
    return conn.collection("trades").updateOne(
        { 
            _id: ObjectId.createFromHexString(tradeId.toString()),
            $or: [
                { fromUserId: ObjectId.createFromHexString(userId.toString()) },
                { toUserId: ObjectId.createFromHexString(userId.toString()) }
            ]
        },
        { $set: { status, updatedAt: new Date() } }
    );
}

// ======= Funções para buscar usuários públicos =======

async function searchPublicUsers(query, excludeUserId) {
    const conn = await connect();
    const excludeId = excludeUserId ? ObjectId.createFromHexString(excludeUserId.toString()) : null;
    
    const searchQuery = {
        $or: [
            { name: new RegExp(query, 'i') },
            { email: new RegExp(query, 'i') }
        ]
    };
    
    // Inclui usuários públicos ou sem o campo isPublic (compatibilidade)
    searchQuery.$or = [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
    ];
    
    if (excludeId) {
        searchQuery._id = { $ne: excludeId };
    }
    
    return conn.collection("users")
        .find(searchQuery)
        .project({ password: 0 })
        .limit(20)
        .toArray();
}

module.exports = {
    PAGE_SIZE,
    connect,
    // Funções relacionadas aos clientes
    countCustomers,
    findCustomers,
    findCustomer,
    insertCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomersByName,
    // Funções relacionadas aos pedidos
    countOs,
    findOss,
    findOs,
    insertOs,
    updateOs,
    deleteOs,
    searchOSByName,
    // Funções relacionadas aos usuários
    countUsers,
    findUsers,
    findUser,
    insertUser,
    updateUser,
    deleteUser,
    insertAutoText,
    updateAutoText,
    deleteAutoText,
    findAutoTextById,
    findAutoTextsByUserId,
    findAutoTextByName,
    // Convites
    createInvite,
    findInviteByCode,
    markInviteUsed,
    findInvitesByUser,
    // Amigos
    addFriendRelation,
    getFriends,
    removeFriend,
    // Solicitações de amizade
    createFriendRequest,
    findFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    // Produtos
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    // Trocas
    createTrade,
    getTrades,
    getTradeById,
    updateTradeStatus,
    createTradeMessage,
    getTradeMessages,
    // Busca
    searchPublicUsers,
};

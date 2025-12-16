const { request, response } = require('express');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require("../db");
const sendMail = require("../mail");

// Configuração do armazenamento de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Pasta onde os arquivos serão armazenados
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo será a data atual com a extensão original
  }
});

// Filtro para aceitar apenas certos tipos de arquivos
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};

// Inicializa o middleware do multer com as configurações
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite de 5MB
  },
  fileFilter: fileFilter
});

/* GET home page. */

router.get('/edit/:userId', (request, response) => {
  const id = request.params.userId;
  db.findUser(id)
    .then(user => response.render("newUser", { title: "Edição de usuário", user }))
    .catch(error => console.log(error));
});

router.get('/delete/:userId', (request, response) => {
  const id = request.params.userId;
  db.deleteUser(id)
    .then(result => response.redirect("/users"))
    .catch(error => {
      console.log(error);
      response.render("error", { message: "Não foi possível excluir o Usuário", error });
    });
});

router.get('/new', function (req, res, next) {
  res.render("newUser", { title: "cadastro de usuários", user: {} });
});

router.post('/new', upload.single('profilePic'), async (request, response) => {
  const id = request.body.id;

  if (!request.body.name)
    return response.redirect("/users/new?error=O campo nome é obrigatório!");
  if (!id && !request.body.password)
    return response.redirect("/users/new?error=O campo senha é obrigatório");

  const name = request.body.name;
  const email = request.body.email;
  const profile = parseInt(request.body.profile);
  const profilePic = request.file ? request.file.path : null;

  const user = { name, email, profile };
  if (profilePic) {
    user.profilePic = profilePic;
  }
  if (request.body.password) {
    user.password = request.body.password;
  }

  const nPassword = request.body.password;
 try {
    await id ? db.updateUser(id, user) : db.insertUser(user);

    await sendMail(user.email, "Usuário Criado Com Sucesso", `
      Olá ${user.name}!
      Use senha ${nPassword} para se autenticar em http://192.168.0.18:3001
       
      Att. 
      Admin
    `);

    response.redirect("/users");
  } catch (error) {
    console.error(error);
    response.redirect("/users/new?error=" + error.message);
    response.render("newUser", { message: error.message });
  }
});

router.get('/:page?', async (req, res, next) => {
  const page = parseInt(req.params.page || 1);
  console.log(page)

  try {
    const qty = await db.countUsers();
    const pagesQty = Math.ceil(qty / db.PAGE_SIZE);
    const users = await db.findUsers(page);
    res.render("users", { title: "Usuários", users, qty, pagesQty, page });
    console.log(qty)
  } catch (error) {
    console.log(error);
    res.render("error", { message: "Não foi possível listar os Usuários", error });
  }
});

module.exports = router;
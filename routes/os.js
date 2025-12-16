const { request, response } = require('express');
const express = require('express');
const router = express.Router();
const db = require("../db");
const sendMail = require("../mail");

/* GET home page. */

router.get('/edit/:osId', (request, response) => {
  const id = request.params.osId;
  db.findOs(id)
    .then(os => response.render("newPedido", { title: "Edição OS", os, }))
    .catch(error => console.log(error));
});

router.get('/delete/:osId', (request, response) => {
  const id = request.params.osId;
  db.deleteOs(id)
    .then(result => response.redirect("/os"))
    .catch(error => {
      console.log(error);
      response.render("error", { message: "Não foi possível excluir a OS", error });
    });
});

router.get('/new', (req, res, next) => {
  res.render("newPedido", { title: "Cadastro de OS", os: {} });
});



router.post('/new', (request, response) => {
  if (!request.body.name)
    return response.redirect("/os/new?error=O campo nome é obrigatório!");
  if (!request.body.cpf)
    return response.redirect("/os/new?error=O campo cpf/cnpj deve ser um número");

  const {
    id,
    name,
    telefone,
    celular,
    email,
    rua,
    cep,
    bairro,
    cpf,
    fornecedor,
    insc_estadual,
    qtd,
    qtd2,
    qtd3,
    qtd4,
    qtd5,
    uf,
    numero,
  
    produto,
    produto2,
    produto3,
    produto4,
    produto5,
    numero_serie,
    numero_serie2,
    numero_serie3,
    numero_serie4,
    numero_serie5,
    valor,
    valor2,
    valor3,
    valor4,
    valor5,
    total_sem_frete,
    valor_total,
    banco,
    forma_pgto,
    serasa,
    receita,
    sintegra,
    metodo_envio,
    nome_envio,
    contato_envio,
    data,
    status,
    rastreio,
    alterado_by,
    frete,
    city
  } = request.body;

  const cityFinal = city === "Selecione uma opção:" ? '' : city;

  const os = {
    name,
    cpf: parseInt(cpf),
    telefone,
    metodo_envio,
    rastreio,
    nome_envio,
    data,
    status,
    alterado_by,
    contato_envio,
    banco,
    sintegra,
    receita,
    celular,
    serasa,
    forma_pgto,
    cep,
    valor_total,
    total_sem_frete,
    valor,
    valor2,
    valor3,
    valor4,
    valor5,
    numero_serie,
    numero_serie2,
    numero_serie3,
    numero_serie4,
    numero_serie5,
   
    rua,
    produto,
    produto2,
    produto3,
    produto4,
    produto5,
    qtd,
    qtd2,
    qtd3,
    qtd4,
    qtd5,
    bairro,
    email,
    fornecedor,
    insc_estadual,
    city: cityFinal,
    frete,
    uf,
    numero
  };

  const promise = id ? db.updateOs(id, os) : db.insertOs(os);
  console.log(id);

  
  
  promise
    .then(result => {
      response.redirect("/os");
    })
    .catch(error => {
      console.log(error);
      response.render("error", { message: "Não foi possível salvar a OS", error });
    });
});

router.get('/:page?', async (req, res, next) => {
  const page = parseInt(req.params.page || 1);
  console.log(page);

  try {
    const qty = await db.countOs();
    const pagesQty = Math.ceil(qty / db.PAGE_SIZE);
    const os = await db.findOss(page);
    res.render("pedido", { title: "OS", os, qty, pagesQty, page });
    console.log(qty);
  } catch (error) {
    console.log(error);
    res.render("error", { message: "Não foi possível listar Pedidos", error });
  }
});

module.exports = router;

const { request, response } = require('express');
const express = require('express');
const router = express.Router();
const db = require("../db");

/* GET home page. */


router.get('/edit/:customersId',(request, response)=>{
  const id = request.params.customersId;
  db.findCustomer(id)
  .then(customers => response.render("newCustomer", {title: "Edição de Clientes",customers}))
  .catch(error => console.log(error));

})

router.get('/delete/:customerId', (request, response) => {
  const id = request.params.customerId;
  db.deleteCustomer(id)
      .then(result => response.redirect("/customers"))
      .catch(error => {
          console.log(error);
          res.render("error", { message: "Não foi possível excluir o cliente", error })
      });
})

router.get('/new', function(req, res, next) {
  res.render("newCustomer", {title: "cadastro de Clientes",  customers:{}});
});

router.post('/new', (request, response)=>{
  if(!request.body.name)
  return response.redirect("/customers/new?error= O campo nome é obrigatório!");
  if(!request.body.cpf )
  return response.redirect("/customers/new?error= O campo cpf deve ser um número");
  const id = request.body.id;
  const name= request.body.name;
  const telefone = request.body.telefone;
  const celular = request.body.celular;
  const email = request.body.email;
  const rua = request.body.rua;
  const cep = request.body.cep;
  const bairro = request.body.bairro;
  const cpf = parseInt(request.body.cpf);
  const city = request.body.city === "Selecione uma opção:"? '' : request.body.city;

  const uf = request.body.uf.length > 2? '' : request.body.uf ;

  const customers = { name, cpf, city, uf, telefone, celular, cep, rua, bairro, email };
  const promise = id ? db.updateCustomer(id, customers)
 
                     : db.insertCustomer(customers);
                     console.log(id);
  promise
    .then(result => {
      response.redirect("/customers");
    })
  .catch(error =>{
    return console.log(error);
  })
});


router.get('/:page?', async (req, res, next) => {
  const page = parseInt(req.params.page || 1);
  console.log(page)

  try {
      const qty = await db.countCustomers();
      const pagesQty = Math.ceil(qty / db.PAGE_SIZE);
      const customers = await db.findCustomers(page);
      res.render("customers", { title: "Clientes", customers, qty, pagesQty, page});
      console.log(qty)
  }
  catch (error) {
      console.log(error);
      res.render("error", { message: "Não foi possível listar os clientes", error })
  }
});

module.exports = router;

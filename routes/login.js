
const express = require('express');
const router = express.Router();
const db = require("../db");
const { findUser } = require('../auth');
const auth = require("../auth");
const sendMail = require("../mail");
const passport = require("passport");

/* GET home page. */
router.get('/', function(req, res, next) {
 
      res.render("login", {title: "VRD IA FLOW", message:""});    
   
    });
    router.get('/forgot', function(req, res, next) {
 
      res.render("forgot", {title: "Recuperação de Senha", message:""});    
   
    });

    router.post("/logout", (req, res, next)=>{
      req.logOut((err)=>{
        if (err) return next(err);
        // se foi chamado via navegador tradicional, redireciona
        if (req.accepts("html")) {
          return res.redirect("/");
        }
        // caso contrário, responde JSON para o frontend React
        return res.json({ success: true });
      });
    })

    router.post('/forgot', async(req, res, next)=> {
      const email = req.body.email;
      if (!email) return res.render("forgot", {title: "Recuperação de Senha", message: "O email é obrigatório"});
      const user = await auth.findUserByEmail(email);
      if(!user)
        return res.render("forgot", {title: "Recuperação de Senha", message: "O email não está cadastrado !"});
      const newPassword = auth.generatePassword();
      user.password = newPassword;

      try{
      await db.updateUser(user._id.toString(), user);
      await sendMail(user.email, "Senha alterada com Sucesso", `
       Olá ${user.name}!<br/>
       Sua senha foi alterada com sucesso: <strong>${newPassword}</strong><br/>
       Use-a para se autenticar em ${process.env.FRONTEND_URL || "http://localhost:5178"}<br/><br/>
       Att.<br/>
       Equipe LendMe
      `);

      res.render("Login", {title: "Login", message: "Verifique sua caixa de E-mail"});   

      }catch(err){
        res.render("forgot", {title: "Recuperação de Senha", message: err.message});   

      }
   
    });

    // Login tradicional (renderiza páginas)
    router.post("/login", passport.authenticate("local", {
      successRedirect: "/speechEditor",
      failureRedirect: "/?message=Usuário e/ou  senha inválidos."
    }) )

    // ======== ENDPOINTS PARA O FRONTEND REACT (JSON) ========

    // Login JSON em /api/login
    router.post('/api/login', (req, res, next) => {
      passport.authenticate('local', (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({
            message: info?.message || 'Usuário e/ou senha inválidos.',
          });
        }

        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }

          const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            profile: user.profile,
          };

          return res.json({ user: safeUser });
        });
      })(req, res, next);
    });

    // Usuário logado atual
    router.get('/api/auth/me', (req, res) => {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const user = req.user;
      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        bio: user.bio || '',
        isPublic: user.isPublic !== false, // Por padrão é público
        showEmail: user.showEmail || false,
        allowFriendRequests: user.allowFriendRequests !== false,
        showProducts: user.showProducts !== false,
      };

      return res.json(safeUser);
    });

    // Recuperação de senha via API (SendGrid)
    router.post('/api/forgot', async (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'O email é obrigatório' });
      }

      try {
        const user = await auth.findUserByEmail(email);
        if (!user) {
          return res.status(404).json({ message: 'O email não está cadastrado' });
        }

        const newPassword = auth.generatePassword();
        user.password = newPassword;
        await db.updateUser(user._id.toString(), user);

        await sendMail(user.email, "Recuperação de Senha - LendMe", `
          Olá ${user.name}!<br/>
          Sua nova senha de acesso é: <strong>${newPassword}</strong><br/>
          Use-a para se autenticar em ${process.env.FRONTEND_URL || "http://localhost:5178"}<br/><br/>
          Recomendamos alterar a senha após o primeiro acesso.<br/><br/>
          Att.<br/>
          Equipe LendMe
        `);

        return res.json({ message: 'Senha redefinida. Verifique sua caixa de e-mail.' });
      } catch (err) {
        console.error('Erro em /api/forgot:', err);
        return res.status(500).json({ message: 'Erro ao processar recuperação de senha' });
      }
    });



module.exports = router;
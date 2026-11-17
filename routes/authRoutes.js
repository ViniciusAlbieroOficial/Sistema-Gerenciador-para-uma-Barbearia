const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- NOVO
const pool = require('../db');

const router = express.Router();

// 1. ROTA DE CADASTRO
router.post('/register', async (req, res) => {
    // CORREÇÃO: o register.html envia "senha", não "password"
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    try {
        // Verifica se o e-mail já existe no banco
        const existingUser = await pool.query(
            'SELECT id FROM usuario WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }

        // Criptografa a senha gerando o hash
        const saltRounds = 10;
        const senha_hash = await bcrypt.hash(senha, saltRounds);

        // Insere o novo usuário
        const newUser = await pool.query(
            'INSERT INTO usuario (email, senha_hash) VALUES ($1, $2) RETURNING id, email',
            [email, senha_hash]
        );

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso!',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro interno no servidor ao cadastrar.' });
    }
});

// 2. ROTA DE LOGIN (agora gera o token JWT)
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    try {
        // Busca o usuário no banco pelo e-mail
        const resultado = await pool.query(
            'SELECT id, email, senha_hash FROM usuario WHERE email = $1',
            [email]
        );

        // Mesma mensagem para e-mail inexistente e senha errada
        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }

        const usuario = resultado.rows[0];

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }

        // NOVO: gera o token com o id do usuário, válido por 2 horas
        const token = jwt.sign(
            { id: usuario.id },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            token, // <-- NOVO
            user: {
                id: usuario.id,
                email: usuario.email
            }
        });

    } catch (err) {
        console.error('Erro no login:', err);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

module.exports = router;
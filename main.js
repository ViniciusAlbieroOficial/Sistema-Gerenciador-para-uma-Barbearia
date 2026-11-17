const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const barberRoutes = require('./routes/barberRoutes'); // <-- Importando as rotas da barbearia

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da aplicação
app.use('/api', authRoutes);
app.use('/api', barberRoutes); // <-- Registrando as rotas no Express

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
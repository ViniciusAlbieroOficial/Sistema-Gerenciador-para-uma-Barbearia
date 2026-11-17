const express = require('express');
const pool = require('../db');
const autenticar = require('../middleware/auth'); // <-- NOVO

const router = express.Router();

// Horário de funcionamento (em minutos desde 00:00)
const ABERTURA = 9 * 60;   // 09:00
const FECHAMENTO = 19 * 60; // 19:00

// 1. ROTA PARA LISTAR OS SERVIÇOS (pública)
router.get('/services', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM servicos ORDER BY id ASC');
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao buscar serviços.' });
    }
});

// 2. ROTA PARA CRIAR UM AGENDAMENTO (protegida)
router.post('/appointments', autenticar, async (req, res) => {
    // O usuário vem do TOKEN, nunca do body
    const userId = req.userId;
    const { serviceId, dataHora } = req.body;

    if (!serviceId || !dataHora) {
        return res.status(400).json({ error: 'Preencha todos os campos do agendamento.' });
    }

    // Formato esperado: 2026-11-20T14:30:00
    const formato = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(:\d{2})?$/.exec(dataHora);
    if (!formato || isNaN(new Date(dataHora).getTime())) {
        return res.status(400).json({ error: 'Data ou horário inválido.' });
    }

    // Validação 1: data/hora no passado
    if (new Date(dataHora) < new Date()) {
        return res.status(400).json({ error: 'Não é permitido fazer agendamentos para datas ou horários que já passaram.' });
    }

    const inicioMin = Number(formato[1]) * 60 + Number(formato[2]);

    const client = await pool.connect();

    try {
        // Validação 2: o serviço existe? (e pega a duração)
        const servico = await client.query(
            'SELECT duracao_minutos FROM servicos WHERE id = $1',
            [serviceId]
        );

        if (servico.rows.length === 0) {
            return res.status(400).json({ error: 'Serviço não encontrado.' });
        }

        const duracao = servico.rows[0].duracao_minutos;

        // Validação 3: dentro do horário de funcionamento
        if (inicioMin < ABERTURA || inicioMin + duracao > FECHAMENTO) {
            return res.status(400).json({ error: 'Horário fora do período de funcionamento (09:00 às 19:00).' });
        }

        // Transação + lock: evita que dois clientes reservem o mesmo horário ao mesmo tempo
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(1)');

        // Validação 4: conflito considerando a DURAÇÃO dos serviços
        const conflito = await client.query(
            `SELECT 1
             FROM appointments a
             JOIN servicos s ON s.id = a.servicos_id
             WHERE a.status = 'ativo'
               AND a.data_hora < $1::timestamp + ($2 * INTERVAL '1 minute')
               AND a.data_hora + (s.duracao_minutos * INTERVAL '1 minute') > $1::timestamp
             LIMIT 1`,
            [dataHora, duracao]
        );

        if (conflito.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Este horário já está ocupado. Por favor, escolha outro horário.' });
        }

        // CORREÇÃO: a coluna se chama servicos_id (com "s"), como no seu SQL
        const novo = await client.query(
            `INSERT INTO appointments (usuario_id, servicos_id, data_hora, status)
             VALUES ($1, $2, $3, 'ativo')
             RETURNING *`,
            [userId, serviceId, dataHora]
        );

        await client.query('COMMIT');

        return res.status(201).json({
            message: 'Agendamento realizado com sucesso!',
            appointment: novo.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Erro ao agendar:', err);
        return res.status(500).json({ error: 'Erro ao registrar agendamento no servidor.' });
    } finally {
        client.release();
    }
});

// 3. ROTA PARA LISTAR OS AGENDAMENTOS DO USUÁRIO LOGADO (protegida)
// ANTES: /appointments/:userId  |  AGORA: /appointments
router.get('/appointments', autenticar, async (req, res) => {
    try {
        const query = `
            SELECT a.id, s.nome AS servico, s.preco, a.data_hora, a.status
            FROM appointments a
            JOIN servicos s ON a.servicos_id = s.id
            WHERE a.usuario_id = $1
            ORDER BY a.data_hora ASC
        `;
        const result = await pool.query(query, [req.userId]);
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
        return res.status(500).json({ error: 'Erro ao buscar agendamentos do usuário.' });
    }
});

module.exports = router;
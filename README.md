<p align="center">
  Sistema de gestão e agendamento online para barbearia, com autenticação via JWT, painel do cliente e controle de horários.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</p>

---

## 📖 Sobre o Projeto

O **Rocha Barbearia** é uma aplicação web fullstack que permite aos clientes da barbearia:

- Criar uma conta e fazer login com segurança;
- Visualizar os serviços disponíveis (com preço e duração);
- Agendar horários de forma dinâmica, respeitando a duração do serviço escolhido;
- Consultar seus agendamentos em um painel dedicado;
- Sair da conta com segurança.

O backend foi construído com **Node.js + Express + PostgreSQL**, com autenticação via **JWT** e senhas protegidas com **bcrypt**. O frontend é feito em **HTML, CSS e JavaScript puro**, servido como conteúdo estático pelo Express.

---

## ✨ Funcionalidades

### 🔐 Autenticação
- Cadastro de usuário (`POST /api/register`) com senha hasheada via `bcrypt`.
- Login (`POST /api/login`) que gera um **token JWT** válido por 2 horas.
- Middleware de autenticação (`autenticar`) protegendo rotas privadas.
- Redirecionamento automático para o login em caso de token inválido/expirado.

### 📅 Agendamentos
- Geração **dinâmica de horários** conforme a duração do serviço escolhido.
- Bloqueio de datas passadas (baseado na data local do navegador).
- Validação de:
  - Serviço existente;
  - Horário dentro do funcionamento (09:00 às 19:00);
  - Conflito de horários considerando a **duração** dos serviços;
  - Uso de `pg_advisory_xact_lock` para evitar **concorrência** entre reservas simultâneas.
- Listagem dos agendamentos do usuário logado.

### 🎨 Interface
- Tema escuro com paleta inspirada na logo (marrom café + amarelo-ouro).
- Layout responsivo (desktop e mobile).
- Feedback visual para sucesso e erro em todas as ações.
- Proteção contra **XSS** ao renderizar dados vindos do banco (função `esc`).

---

## 🛠️ Tecnologias

| Camada        | Tecnologias                              |
|---------------|------------------------------------------|
| **Backend**   | Node.js, Express 5, PostgreSQL (`pg`)    |
| **Autenticação** | JWT (`jsonwebtoken`), `bcrypt`        |
| **Configuração** | `dotenv`                              |
| **Frontend**  | HTML5, CSS3, JavaScript (Vanilla)        |
| **Fonte**     | Google Fonts — Inter                     |

---

## 📂 Estrutura do Projeto

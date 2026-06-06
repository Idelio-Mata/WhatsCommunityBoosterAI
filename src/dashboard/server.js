/**
 * Dashboard server for WhatsApp automation bot.
 *
 * Este módulo inicia um servidor Express que fornece uma interface de
 * monitoramento em Português. Todas as rotas são protegidas por autenticação
 * básica usando a senha configurada em `config.DASHBOARD_PASSWORD`.
 */

const express = require('express');
const logger = require('../utils/logger');
const config = require('../../config/config');
const apiRouter = require("../api/index");
/**
 * Middleware de autenticação básica.
 *
 * Verifica o cabeçalho `Authorization` e compara a senha decodificada com
 * `config.DASHBOARD_PASSWORD`. Caso o cabeçalho esteja ausente, responde com 401
 * e o cabeçalho `WWW-Authenticate`. Caso a senha esteja incorreta, responde com
 * 403.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function basicAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.set("WWW-Authenticate", 'Basic realm="Dashboard"');
    return res.status(401).send("Autenticação necessária");
  }
  const token = authHeader.split(" ")[1] || "";
  const decoded = Buffer.from(token, "base64").toString("utf8");
  // O formato esperado é "username:password"; ignoramos o username.
  const password = decoded.split(":")[1] || "";
  if (password !== config.DASHBOARD_PASSWORD) {
    return res.status(403).send("Senha incorreta");
  }
  next();
}

/**
 * Cria e inicia o servidor de dashboard.
 *
 * @returns {Promise<import('http').Server>} Promise que resolve com o servidor HTTP.
 */
async function startDashboard() {
  const app = express();
  app.use(express.json());
  app.use(basicAuth);

  // Rotas da API
  app.use("/api", apiRouter);

  // Página principal do dashboard
  app.get("/", async (req, res) => {
    try {
      const html = generateDashboardHtml();
      res.send(html);
    } catch (err) {
      logger.error({ err }, "Erro ao renderizar dashboard");
      res.status(500).send("Erro interno");
    }
  });

  return new Promise((resolve, reject) => {
    const server = app
      .listen(config.DASHBOARD_PORT, () => {
        logger.info(`Dashboard iniciado na porta ${config.DASHBOARD_PORT}`);
        resolve(server);
      })
      .on("error", (err) => {
        logger.error({ err }, "Falha ao iniciar o dashboard");
        reject(err);
      });
  });
}

/**
 * Gera o HTML completo do dashboard com estilos inline.
 *
 * @returns {string}
 */
function generateDashboardHtml() {
  const style = `
    body { background:#0a0a0a; color:#fff; font-family:Arial,Helvetica,sans-serif; margin:0; padding:0; }
    .header { padding:20px; text-align:center; background:#075e54; position:relative; }
    .status { width:12px; height:12px; background:#25D366; border-radius:50%; display:inline-block; margin-left:10px; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity:1; } 50% { opacity:0.4; } 100% { opacity:1; } }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:10px; padding:20px; }
    .card { background:#1e1e1e; padding:10px; border-radius:5px; text-align:center; }
    table { width:100%; border-collapse:collapse; margin:20px 0; }
    th, td { padding:8px; border:1px solid #333; text-align:left; }
    th { background:#075e54; }
    .badge { padding:2px 6px; border-radius:3px; color:#fff; font-size:0.9em; }
    .pending { background:grey; }
    .sent { background:blue; }
    .replied { background:green; }
    .added { background:#00ff7f; }
    .failed { background:red; }
  `;

  const html = `<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Dashboard do Bot</title>
    <style>${style}</style>
    <script>
      async function refresh() {
        const [statsRes, actRes, contRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/activity'),
          fetch('/api/contacts'),
        ]);
        const stats = await statsRes.json();
        const activity = await actRes.json();
        const contacts = await contRes.json();
        document.getElementById('stats').innerHTML = '<div class="grid">' +
          '<div class="card"><strong>Total Contactos</strong><br/>' + stats.total_contacts + '</div>' +
          '<div class="card"><strong>Mensagens Hoje</strong><br/>' + stats.today.messages_sent + '</div>' +
          '<div class="card"><strong>Respostas Hoje</strong><br/>' + stats.today.replies+ '</div>' +
          '<div class="card"><strong>Adicionados Hoje</strong><br/>' + stats.today.added + '</div>' +
          '<div class="card"><strong>Total Adicionados</strong><br/>' + stats.added + '</div>' +
          '<div class="card"><strong>Pendentes</strong><br/>' + stats.pending + '</div>' +
          '</div>';
        const actRows = activity.map(a => '<tr><td>' + new Date(a.created_at).toLocaleTimeString('pt-MZ') + '</td><td>' + a.phone.replace('@s.whatsapp.net','') + '</td><td>' + a.action.replace(/_/g,' ') + '</td><td>' + (a.group_id || '—') + '</td></tr>').join('');
        document.getElementById('activity').innerHTML = '<table><thead><tr><th>Hora</th><th>Número</th><th>Acção</th><th>Grupo</th></tr></thead><tbody>' + actRows + '</tbody></table>';
        const contRows = contacts.map(c => '<tr><td>' + c.phone.replace('@s.whatsapp.net','') + '</td><td>' + (c.name || '—') + '</td><td>' + (c.group_name || '—') + '</td><td><span class="badge ' + c.status + '">' + c.status + '</span></td><td>' + new Date(c.updated_at).toLocaleString('pt-MZ') + '</td></tr>').join('');
        document.getElementById('contacts').innerHTML = '<table><thead><tr><th>Número</th><th>Nome</th><th>Grupo</th><th>Estado</th><th>Actualizado</th></tr></thead><tbody>' + contRows + '</tbody></table>';
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString('pt-BR');
      }
      setInterval(refresh, 10000);
      window.onload = refresh;
    </script>
  </head>
  <body>
    <div class="header">
      <h1>Bot WhatsApp <span class="status"></span></h1>
    </div>
    <div id="stats"></div>
    <h2 style="padding-left:20px;">Atividade Recente</h2>
    <div id="activity"></div>
    <h2 style="padding-left:20px;">Contactos</h2>
    <div id="contacts"></div>
    <div style="text-align:center; padding:10px; font-size:0.8em;">Última atualização: <span id="lastUpdate"></span></div>
  </body>
  </html>`;
  return html;
}

module.exports = { startDashboard };

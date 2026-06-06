/**
 * Dashboard server for WhatsApp automation bot.
 *
 * Este módulo inicia um servidor Express que fornece uma interface de
 * monitoramento em Português. Todas as rotas são protegidas por autenticação
 * básica usando a senha configurada em `config.DASHBOARD_PASSWORD`.
 */

const express = require('express');
const path = require("path");
const logger = require("../utils/logger");
const config = require("../../config/config");
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

  // Ficheiros estáticos do dashboard
  app.use(express.static(path.join(__dirname, "public")));

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
module.exports = { startDashboard };

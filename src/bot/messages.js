/**
 * Generates a greeting message for a contact before adding them to the vehicles group.
 * The message is human‑like, uses WhatsApp bold formatting and asks if the person wants to be added.
 *
 * @param {string} [name] - Optional name of the contact. If omitted a generic term is used.
 * @returns {string} The formatted greeting message (max 5 lines).
 */
function greeting(name) {
  const person = name ? name.trim() : '';
  // Using WhatsApp markdown for bold: *text*
  const salutation = person ? `*Olá ${person}!* 👋` : `*Olá!* 👋`;
  return `${salutation}\n`
    + `Encontrei o seu contacto numa comunidade de viaturas.\n`
    + `Temos um grupo com *ofertas e negócios de viaturas diariamente* — acredito que será do seu interesse.\n`
    + `Posso adicioná-lo ao grupo? Responda *SIM* 🚗`;
}

/**
 * Generates a welcome message for a new member inside the vehicles group.
 * The message is friendly, warm, includes emojis and briefly explains the group purpose.
 *
 * @param {string} [name] - Optional name of the new member. If omitted a generic term is used.
 * @returns {string} The formatted welcome message (max 6 lines).
 */
function welcome(name) {
  const person = name ? name.trim() : '';
  const salutation = person ? `👋 Bem-vindo ao grupo, *${person}*!` : `👋 Bem-vindo ao grupo!`;
  return `${salutation}\n`
    + `🚗 Aqui partilhamos ofertas, negócios e novidades sobre viaturas.\n`
    + `💬 Fique à vontade para fazer perguntas ou partilhar o que procura.\n`
    + `Boas negociações! 🤝`;
}

/**
 * Message sent when a contact replies but their group could not be resolved.
 * It reassures the user that they will be added shortly.
 *
 * @returns {string} The short reassuring message.
 */
function groupNotFound() {
 return `Obrigado pela resposta! ✅\n`
    + `Estou a processar o seu pedido e será adicionado ao grupo em breve.`;  
}

module.exports = {
  greeting,
  welcome,
  groupNotFound,
};

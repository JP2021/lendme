const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM || process.env.SMTP_USERNAME;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY não configurada. Envio de e-mails será ignorado em desenvolvimento.");
}

/**
 * Envia um e-mail usando SendGrid
 * @param {string|string[]} to - destinatário(s)
 * @param {string} subject - assunto
 * @param {string} html - corpo em HTML
 */
module.exports = async (to, subject, html) => {
  if (!SENDGRID_API_KEY) {
    console.log("[DEV] Envio de e-mail simulado:", { to, subject });
    return;
  }

  const msg = {
    to,
    from: SENDGRID_FROM,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("E-mail enviado com sucesso via SendGrid");
  } catch (err) {
    console.error("Erro ao enviar e-mail via SendGrid:", err);
    throw err;
  }
};

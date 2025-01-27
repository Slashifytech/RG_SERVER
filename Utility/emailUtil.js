const dotenv = require("dotenv");
const SibApiV3Sdk = require("@getbrevo/brevo");

dotenv.config();

const BREVO_API = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.DOMAIN_EMAIL;
// const senderName = process.env.SENDER_IDENTITY;

const AMC_EMAIL = process.env.AMC_EMAIL;
const BUYBACK_EMAIL = process.env.BUYBACK_EMAIL;

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = BREVO_API;

const sendEmail = async ({
  to,
  subject,
  htmlContent,
  pdfPolicyBuffer,
  pdfInvoiceBuffer,
  policyFilename,
  invoiceFilename,
  rmEmail,
  gmEmail,
  policyType,
  agentEmail,
}) => {
  try {
    // console.log(to);

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      email:
        policyType === "AMC" && AMC_EMAIL
          ? AMC_EMAIL
          : policyType === "Buyback" && BUYBACK_EMAIL
          ? BUYBACK_EMAIL
          : EMAIL_FROM,
    };
    const recipients = [
      { email: to },
  
    ];

    sendSmtpEmail.to = recipients;

    if (pdfPolicyBuffer && pdfInvoiceBuffer) {
      sendSmtpEmail.attachment = [
        {
          content: Buffer.from(pdfPolicyBuffer).toString("base64"),
          name: policyFilename,
        },
        {
          content: Buffer.from(pdfInvoiceBuffer).toString("base64"),
          name: invoiceFilename,
        },
      ];
    }

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully", recipients);
  } catch (error) {
    console.log("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };

const dotenv = require("dotenv");
const SibApiV3Sdk = require("@getbrevo/brevo");

dotenv.config();

const EMAIL_FROM = process.env.DOMAIN_EMAIL;
// const senderName = process.env.SENDER_IDENTITY;

const AMC_EMAIL = process.env.AMC_EMAIL;
const BUYBACK_EMAIL = process.env.BUYBACK_EMAIL;
const EW_EMAIL = process.env.EW_POLICY_EMAIL;

const sendEmail = async ({
  to,
  subject,
  htmlContent,
  pdfPolicyBuffer,
  pdfInvoiceBuffer,
  policyFilename,
  invoiceFilename,
  policyType,
  ccEmails = [],
}) => {
  const BREVO_API =
    policyType === "EwPolicy"
      ? process.env.BREVO_CP_API_KEY
      : process.env.BREVO_API_KEY;

  let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  let apiKey = apiInstance.authentications["apiKey"];
  apiKey.apiKey = BREVO_API;
  try {
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      email:
        policyType === "AMC" && AMC_EMAIL
          ? AMC_EMAIL
          : policyType === "Buyback" && BUYBACK_EMAIL
          ? BUYBACK_EMAIL
          : policyType === "EwPolicy" && EW_EMAIL
          ? EW_EMAIL
          : EMAIL_FROM,
    };
    const recipients = [{ email: to }];

    sendSmtpEmail.to = recipients;
    if (ccEmails?.length > 0) {
      sendSmtpEmail.cc = ccEmails.map((email) => ({ email }));
    }

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

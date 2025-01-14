const dotenv = require("dotenv");
const SibApiV3Sdk = require("@getbrevo/brevo");

dotenv.config();

const BREVO_API = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.DOMAIN_EMAIL;
const senderName = process.env.SENDER_IDENTITY;

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
}) => {
console.log(to, "email check")
  // if (!pdfPolicyBuffer || !pdfInvoiceBuffer) {
  //   console.error("PDF buffers are required. Received:", {
  //     pdfPolicyBuffer,
  //     pdfInvoiceBuffer,
  //   });
  //   throw new Error("PDF buffers cannot be undefined");
  // }
  // const policyBuffer = Buffer.from(pdfPolicyBuffer, "utf-8");
  // const invoiceBuffer = Buffer.from(pdfInvoiceBuffer, "utf-8");

  try {
    // console.log(to);

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { email: EMAIL_FROM };

    let recieversEmail = to;
    sendSmtpEmail.to = [{ email: recieversEmail }];

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
    console.log("Email sent successfully");
  } catch (error) {
    console.log("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };

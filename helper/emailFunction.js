const dotenv = require("dotenv");
const { sendEmail } = require("../Utility/emailUtil");
const { encodeEmail } = require("../Utility/utilityFunc");

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL  ;

const sendUserEmail = async ({
  to,
  subject,
  htmlContent,
  pdfPolicyBuffer,
  pdfInvoiceBuffer,
  policyFilename,
  invoiceFilename,
}) => {
  await sendEmail({
    to,
    subject,
    htmlContent,
    pdfPolicyBuffer,
    pdfInvoiceBuffer,
    policyFilename,
    invoiceFilename,
  });
};
const getEmailTemplate = (
  type,
  email,
  password,
  customerName,
  agentName,
  policyId,
  vehicleModel,
  reason,
  fileName,
  invoiceId
) => {
  let template;
  let userName = agentName || "user";
  const styles = `
    font-family: Arial, sans-serif; 
    font-size: 16px;
    line-height: 1.5;
    color: #333;
    background-color: rgba(255, 255, 255, 0.7); /* Transparent with opacity 0.7 */
    margin: 5% 10%;
    padding: 10px 5px;
    text-align: left;
    display: inline-block;
  `;

  switch (type) {
    case "credentials":
      template = `
        <div style="text-align: center;">
          <div style="${styles}">
            <p>Dear ${userName},</p>
            <p>We are excited to inform you that your account has been successfully created in our policy portal.</p>
            <p>Account Details:</p>
          
            <p>Here are your login details:</p>
            <p>Login URL - <a href="https://360carprotect.in/360policy/login">360 Policy</a></p>
            <p>Email ID - ${email}</p>
            <p>Password: - ${password}</p>
            <p>Please use the above credentials to log in. </p>
            <p>If you encounter any issues, feel free to reach out to our support team.</p>
            <p>Welcome aboard, and we look forward to working with you!</p></br></br>
            <p>Best regards,</p>
            <p>360 Car Protect</p>
            <hr/>
            <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
          </div>
        </div>
      `;
      break;
    case "verifyDocument":
      const expires = Math.floor(Date.now() / 1000) + 72 * 3600; // Current time + 72 hours in seconds
      template = `
          <div style="text-align: center;">
            <div style="${styles}">
              <p>Dear ${userName},</p>
              <p>You have received the invoice ${invoiceId} and policy ${policyId} documents for your review. Please find both documents attached.</p>
      
              <p>To review the terms and conditions and provide your agreement, click the link below:</p>
              <p>Review and Agree</p>
              <p>Click on the link to verify and approve - 
                <a href="https://360carprotect.in/customer-consent?noav=${expires}&efall=${encodeEmail(
        email
      )}">Consent of 360 Policy Terms & Conditions</a>
              </p>
              <p>Email ID - ${email}</p>
              <p>If you have any questions, feel free to reach out.</p></br></br>
              <p>Best regards,</p>
              <p>360 Admin</p>
              <hr/>
              <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
            </div>
          </div>
        `;
      break;
    case "adminReqToAgentForApproval":
      template = `
              <div style="text-align: center;">
                <div style="${styles}">
                  <p>Dear ${userName},</p>
                  <p>You have received a new invoice ${invoiceId} and policy ${policyId}  for your review. Kindly review and provide your approval or rejection at your earliest convenience.</p>
                  <p>Feel free to reach out if you require additional details.</p>
                  <p>Next Steps: Please review the details and make the necessary corrections before resubmitting the policy. If you need further clarification, feel free to reach out.</p>
                 
                  <p>Best Regards</p>
               <p>360 Admin</p>
                  <hr/>
                  <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
                </div>
              </div>
            `;
      break;
    case "agentDocumentRejected":
      template = `
              <div style="text-align: center;">
                <div style="${styles}">
                  <p>Dear Admin,</p>
                  <p>I have reviewed the invoice ${invoiceId} and policy ${policyId} and the associated policy. Unfortunately, I am unable to approve them.</p>
                  <p>Reason for Rejection:</p>
                  <p>${reason}</p>
                  <p>Kindly address the issue and resend for approval.</p>
                 
                  <p>Best Regards</p>
               <p>${userName}</p>
                  <hr/>
                  <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
                </div>
              </div>
            `;
      break;

    case "agentDocumentApproved":
      template = `
                <div style="text-align: center;">
                  <div style="${styles}">
                    <p>Dear Admin,</p>
                    <p>I have reviewed the invoice ${invoiceId} and policy ${policyId} and the associated policy, and I am pleased to confirm that both have been approved.</p>
                  
                    <p>Please let me know if further input is required.</p>
                   
                    <p>Best Regards</p>
                 <p>${userName}</p>
                    <hr/>
                    <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
                  </div>
                </div>
              `;
      break;
    case "invoiceApproved":
      template = `
                  <div style="text-align: center;">
                    <div style="${styles}">
                      <p>Dear Admin,</p>
                      <p>We have reviewed the invoice (Invoice Number: ${invoiceId}) and are pleased to inform you that it has been approved.</p>
                      <p>Please let us know if further action is required on our end.</p>
                     
                      <p>Best Regards,</p>
                      <p>Accounts Team</p>
                    </div>
                  </div>
                `;
      break;
    case "invoiceRejected":
      template = `
                    <div style="text-align: center;">
                      <div style="${styles}">
                        <p>Dear Admin,</p>
                        <p>We have reviewed the invoice (Invoice Number: ${invoiceId}) and regret to inform you that it has been rejected.</p>
                        <p>Reason for Rejection: ${reason}</p>
                        <p>Please let us know if further action is required on our end.</p>
                       
                        <p>Best Regards,</p>
                        <p>Accounts Team</p>
                      </div>
                    </div>
                  `;
      break;
    case "AgentPolicyRejected":
      template = `
          <div style="text-align: center;">
            <div style="${styles}">
              <p>Dear ${userName},</p>
              <p>We regret to inform you that the policy submitted for your customer, ${customerName}, has been rejected.</p>
              <p>Reason for Rejection: ${reason}</p>
              <p>Next Steps: Please review the details and make the necessary corrections before resubmitting the policy. If you need further clarification, feel free to reach out.</p>
              <p>Thank you for your understanding and cooperation.</p></br>
              <p>Best Regards,</p>
              <p>360 Car Protect</p>
              <hr/>
              <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
            </div>
          </div>
        `;
      break;
    case "AgentPolicyAccepted":
      template = `
            <div style="text-align: center;">
              <div style="${styles}">
                <p>Dear ${userName},</p>
                <p>We are pleased to inform you that the policy for your customer, ${customerName}, has been successfully approved.</p>
                <p>Policy Details:</p>
                <p>Policy ID: ${policyId}</p>
                <p>Customer Name: ${customerName}</p>
                <p>Car Model: ${vehicleModel}</p>
                <p>You may now inform the customer and proceed with the next steps.</p></br>
                <p>Thank you for your prompt submission!</p>
              <p>Best regards,</p>
                <p>360 Car Protect</p>
                <hr/>
                <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
              </div>
            </div>
          `;
      break;
    case "CustomerPolicyAccepted":
      template = `
              <div style="text-align: center;">
                <div style="${styles}">
                  <p>Dear ${customerName},</p>
                  <p>We are happy to let you know that your extended warranty policy for your ${vehicleModel} has been approved.</p>
                  <p>Policy Details:</p></br>
                  <p>Policy ID: ${policyId}</p>
                  <p>You can now enjoy the peace of mind that comes with our extended warranty.</p>
                  <p>If you have any questions or need assistance, feel free to reach out.</p>
                  <p>You may now inform the customer and proceed with the next steps.</p></br>
                  <p>Thank you for your patience!</p>
                <p>Best regards,</p>
                <p>360 Car Protect</p>
                  <hr/>
                  <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
                </div>
              </div>
            `;
      break;
    case "agentPolicyCancelled":
      template = `
                <div style="text-align: center;">
                  <div style="${styles}">
                    <p>Dear ${userName},</p>
                   We would like to inform you that the policy for your customer, ${customerName}, has been cancelled.

                    <p>Policy Details:</p></br>
                    <p>Policy ID: ${policyId}</p>
                    <p>Coustomer Name: ${customerName}</p>
                    <p>Car Model: ${vehicleModel}</p>


                    <p>If this cancellation was made in error or you require further assistance, please contact us for clarification.</p></br>
                 
                    <p>Thank you for your attention to this matter.</p>
                  <p>Best regards,</p>
                  <p>360 Car Protect</p>
               
                    <hr/>
                    <p>For any queries please reach out to us at ${ADMIN_EMAIL}</p>
                  </div>
                </div>
              `;
      break;
    default:
      throw new Error("Invalid email type");
  }
  return template;
};

exports.sendAgentCredEmail = async (userEmail, password, name) => {
  console.log(userEmail, password, name);
  const subject =
    "Your Account Has Been Created – Welcome to 360 Policy Portal";
  const htmlContent = getEmailTemplate(
    "credentials",
    userEmail, // email
    password, // password
    null, // customerName (not used)
    name, // agentName
    null, // policyId
    null, // vehicleModel
    null,
    null,
    null,
    null
  );
  console.log(htmlContent);

  await sendUserEmail({
    to: userEmail,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};
exports.sendAgentRejected = async (
  userEmail,
  customerName,
  agentName,
  reason
) => {
  const subject = "Policy Rejected";
  const htmlContent = getEmailTemplate(
    "AgentPolicyRejected",
    userEmail,
    null,
    customerName,
    agentName,
    null,
    null,
    reason,
    null,
    null,
    null
  );

  await sendUserEmail({
    to: userEmail,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};
exports.sendAgentAccepted = async (
  userEmail,
  customerName,
  agentName,
  policyId,
  vehicleModel
) => {
  const subject = "Policy Accepted by 360";
  const htmlContent = getEmailTemplate(
    "AgentPolicyAccepted",
    userEmail, // email
    null, // password
    customerName, // customerName
    agentName, // agentName
    policyId, // policyId
    vehicleModel, // vehicleModel
    null,
    null,
    null,
    null
  );
  await sendUserEmail({
    to: userEmail,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};
exports.sendCustomerAccepted = async (
  userEmail,
  customerName,
  policyId,
  vehicleModel
) => {
  const subject = "Policy Accepted";
  const htmlContent = getEmailTemplate(
    "CustomerPolicyAccepted",
    userEmail, // email
    null, // password
    customerName, // customerName
    null, // agentName
    policyId, // policyId
    vehicleModel, // vehicleModel
    null,
    null,
    null,
    null
  );

  await sendUserEmail({
    to: userEmail,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};

exports.agentCancelledPolicy = async (
  userEmail,
  customerName,
  agentName,
  policyId,
  vehicleModel
) => {
  const subject = "Policy Cancelled";
  const htmlContent = getEmailTemplate(
    "agentPolicyCancelled",
    userEmail, // email
    null, // password
    customerName, // customerName
    agentName, // agentName
    policyId, // policyId
    vehicleModel, // vehicleModel
    null,
    null,
    null,
    null
  );

  await sendUserEmail({
    to: userEmail,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};

exports.documentApprovalToClient = async (
  userEmail,
  customerName,
  invoiceId,
  pdfPolicyBuffer,
  pdfInvoiceBuffer,
  policyFilename,
  invoiceFilename,
  policyId
) => {
  const subject = "Review and Agree: Invoice and Policy";
  const htmlContent = getEmailTemplate(
    "verifyDocument",
    userEmail, // email
    null, // password
    customerName, // customerName
    null, // agentName
    policyId, // policyId
    null, // vehicleModel
    null,
    null,
    invoiceId
    // fileName,
    // pdfBuffer,
  );
  await sendUserEmail({
    to: userEmail,
    subject,
    htmlContent,
    pdfPolicyBuffer,
    pdfInvoiceBuffer,
    policyFilename,
    invoiceFilename,
  });
};

exports.documentApprovalToAgent = async (
  userEmail,
  agentName,
  invoiceId,

  policyId
) => {
  const subject = "Request for Approval: Invoice  and Policy";
  const htmlContent = getEmailTemplate(
    "adminReqToAgentForApproval",
    userEmail, // email
    null, // password
    null, // customerName
    agentName, // agentName
    policyId, // policyId
    null, // vehicleModel
    null,
    null,
    invoiceId
  );

  await sendUserEmail({
    to: userEmail,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};

exports.documentRejectedByAgent = async (
  
  agentName,
  message,
  invoiceId,

  policyId
) => {
  const subject = "Rejection of Invoice and Policy";
  const htmlContent = getEmailTemplate(
    "agentDocumentRejected",
    ADMIN_EMAIL, // email
    null, // password
    null, // customerName
    agentName, // agentName
    policyId, // policyId
    null, // vehicleModel
    message,
    null,
    invoiceId
  );

  await sendUserEmail({
    to: ADMIN_EMAIL,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};

exports.documentApprovedByAgent = async (
  agentName,
  invoiceId,

  policyId
) => {
  const subject = "Approval of Invoice and Policy";
  const htmlContent = getEmailTemplate(
    "agentDocumentApproved",
    ADMIN_EMAIL, // email
    null, // password
    null, // customerName
    agentName, // agentName
    policyId, // policyId
    null, // vehicleModel
    null,
    null,
    invoiceId
  );

  await sendUserEmail({
    to: ADMIN_EMAIL,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};

exports.invoiceApproved = async (invoiceId) => {
  const subject = "Invoice Accepted";
  const htmlContent = getEmailTemplate(
    "invoiceApproved",
    ADMIN_EMAIL, // email
    null, // password
    null, // customerName
    null, // agentName
    null, // policyId
    null, // vehicleModel
    null,
    null,
    invoiceId
  );

  await sendUserEmail({
    to: ADMIN_EMAIL,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};

exports.invoiceRejected = async (invoiceId, message) => {
  const subject = "Invoice Rejected";
  const htmlContent = getEmailTemplate(
    "invoiceRejected",
    ADMIN_EMAIL, // email
    null, // password
    null, // customerName
    null, // agentName
    null, // policyId
    null, // vehicleModel
    message,
    null,
    invoiceId
  );

  await sendUserEmail({
    to: ADMIN_EMAIL,
    subject,
    htmlContent,
    optional: null,
    optional: null,
    optional: null,
  });
};

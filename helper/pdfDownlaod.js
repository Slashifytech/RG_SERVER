
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { formatIsoDate } = require('../Utility/utilityFunc');

const renderEmailTemplate = async (data, pathData) => {
  try {
    const templatePath = path.join(__dirname, `${pathData}`);

    if (!fs.existsSync(templatePath)) {
      throw new Error('Template file does not exist.');
    }

    const template = fs.readFileSync(templatePath, 'utf-8');
    
    return ejs.render(template, {
      data: data,
      date: formatIsoDate(data?.createdAt)
      
    });
  } catch (error) {
    console.error('Error rendering email template:', error);
    throw error;
  }
};



const generatePdf = async (html, pdfType) => {
  let browser;
  try {
    // Launch Puppeteer with error-resilient options
    // browser = await puppeteer.launch({
    //   headless: true,
    //   args: ['--no-sandbox', '--disable-setuid-sandbox'], // Add sandbox flags for restricted environments
    //   timeout: 90000, // Increase timeout to 60 seconds
    // });
     browser = await puppeteer.launch({  //production code for aws ec2 
      executablePath: '/usr/bin/chromium-browser', // Path to system-installed Chromium
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    

    const page = await browser.newPage();

    // Set the HTML content with a timeout safeguard
    await page.setContent(html, { waitUntil: 'networkidle0' });
     let pdfBuffer;
    if(pdfType === "pdfInvoice"){
      pdfBuffer = await page.pdf({
        format: 'A3',
        printBackground: true, // Include background styles
      });
    }
    if(pdfType === "pdfbuyBack"){
       pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, 
      });
    }
    
    if(pdfType === "pdfAmc"){
      pdfBuffer = await page.pdf({
       format: 'A4',
       printBackground: true, 
     });
   }
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  renderEmailTemplate,
  generatePdf,
};


const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { formatIsoDate } = require('../Utility/utilityFunc');

const renderEmailTemplate = async (data, pathData, typeData) => {

  try {
    const templatePath = path.join(__dirname, `${pathData}`);

    if (!fs.existsSync(templatePath)) {
      throw new Error('Template file does not exist.');
    }

    const template = fs.readFileSync(templatePath, 'utf-8');
    
    return ejs.render(template, {
      data: data,
      date: formatIsoDate(data?.createdAt),
      titleData: typeData === "ewPolicy" ?    "360 CAR PROTECT INDIA LLP": "RAAM4WHEELERS LLP",
      addressData: typeData === "ewPolicy" ? "3-4-138, 138/A Flat No.501, Royal Elegance, Himayathnagar, Barkatpura, Hyderabad, Hyderabad,Telangana, 500027, Ph: 7799935258, Email Id: hyderabad.crmhead@mgdealer.co.inWebsite: www.mghyderabad.co.in, GSTIN: 36AAYFR9176L1ZY, CIN NO: AAN-7654, PAN: AAYFR9176L"
      : "8-2-120/86/10,10A,11B,11C and 11D, Opp: Hotel Park Hyatt,   Road Number 2, Banjara Hills Hyderabad, PIN-500033, Ph: 7799935258, Email Id: hyderabad.crmhead@mgdealer.co.in, Website: https://www.mghyderabad.co.in,  GSTIN: 36AAYFR9176L1ZY, CIN NO: AAN-7654, PAN: AAYFR9176L",
      imageData: "https://firebasestorage.googleapis.com/v0/b/car-protect-99a26.firebasestorage.app/o/files%2F360%20Stamp.jpeg?alt=media&token=81df3540-54f5-4c1d-9769-8577062ba2f0",
      imageDataOne:typeData !== "ewPolicy" &&"https://firebasestorage.googleapis.com/v0/b/car-protect-99a26.firebasestorage.app/o/files%2FMG-symbol-black-2010-1920x1080-removebg-preview.png?alt=media&token=4df87beb-002a-4956-9ad4-36902a5a6bdd"
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
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
      timeout: 180000, // Increased timeout
    });

    //  browser = await puppeteer.launch({  //production code for aws ec2 
    //   executablePath: '/usr/bin/chromium-browser', // Path to system-installed Chromium
    //   headless: true,
    //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // });
    

    const page = await browser.newPage();

    // Increase timeout settings
    await page.setDefaultTimeout(180000);
    await page.setDefaultNavigationTimeout(180000);
  // Block unnecessary requests (images, fonts, styles)
  // await page.setRequestInterception(true);
  // page.on("request", (req) => {
  //   if (["image", "stylesheet", "font"].includes(req.resourceType())) {
  //     req.abort();
  //   } else {
  //     req.continue();
  //   }
  // });
    
  await page.setContent(html, { waitUntil: 'load' });

  let pdfBuffer;
  if (pdfType === "pdfInvoice") {
    pdfBuffer = await page.pdf({ format: "A3", printBackground: true });
  } else if (pdfType === "pdfbuyBack") {
    pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  } else if (pdfType === "pdfEwPolicy") {
    pdfBuffer = await page.pdf({ format: "A2", printBackground: true });
  } else if (pdfType === "pdfAmc") {
    pdfBuffer = await page.pdf({ format: "A3", printBackground: true });
  }

  // console.log("PDF generated successfully!");
  return pdfBuffer;
} catch (error) {
  console.error("Error generating PDF:", error);
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

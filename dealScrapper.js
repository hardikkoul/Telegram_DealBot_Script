const puppeteer = require('puppeteer');
const axios = require('axios');
const { BitlyClient } = require('bitly');


// Replace <AMAZON_ASSOCIATE_USERNAME> and <AMAZON_ASSOCIATE_PASSWORD> with your own credentials
const amazonAssociateUsername = '<AMAZON_ASSOCIATE_USERNAME>';
const amazonAssociatePassword = '<AMAZON_ASSOCIATE_PASSWORD>';

const bitlyAccessToken = '<BITLY ACCESS TOKEN>';

// Replace <BOT_TOKEN> with your Telegram bot's API token
const botToken = '<TELEGRAM BOT TOKEN>';
const chatId = '<CHAT ID>'; // Replace with your Telegram chat ID
let firstLinkIndex=0;
async function getProductLinks() {
  try {
    console.log("Inside try block");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set the viewport size
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the Amazon Associate login page
    await page.goto('<YOUR AMAZON ASSOCIATE URL>');

    console.log("Opened Amazon Associate login page");

    // Wait for and fill the email input field
    
    await page.waitForSelector('#ap_email', { timeout: 60000 });
    await page.type('#ap_email', amazonAssociateUsername);
    console.log("added email");
    // Wait for and click the continue button
    await page.waitForSelector('#continue');
    await page.click('#continue');

    // Wait for and fill the password input field
    await page.waitForSelector('#ap_password');
    await page.type('#ap_password', amazonAssociatePassword);

    // Wait for and click the submit button
    await page.waitForSelector('#signInSubmit');
    await page.click('#signInSubmit');

    console.log("Submitted login form");

    // Wait for the login process to complete and navigate to the desired page
    await page.waitForNavigation();
    await page.goto('<AMAZON DEALS LINK>');

    console.log("Navigated to product page");

    // Extract the links using the appropriate selector
    const productLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.a-link-normal'));
      return links.map(link => link.href);
    });
    await browser.close();
    console.log("link : ",productLinks[firstLinkIndex]);
    // Send the product links to the Telegram bot with a delay

    const intervalId = setInterval(async () => {
        if (firstLinkIndex < productLinks.length) {
        const shortenedLink = await shortenLink(productLinks[firstLinkIndex]);
        console.log("Shortened Link is ::",shortenedLink);
          await sendProductLinksToTelegram(shortenedLink);
          firstLinkIndex++;
        } else {
          clearInterval(intervalId);
          console.log('All product links sent to Telegram');
        }
        },18000);
  } catch (error) {
    console.error('Error fetching product links:', error.message);
  }
}

async function sendProductLinksToTelegram(productLinks) {
  try {

    let message = '🔥Amazon India Deal🔥\n\n'+ `${productLinks}\n\n`;
    
    console.log("message to send is ::",message);

    // Send the message to the Telegram bot chat
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });
  } catch (error) {
    console.error('Error sending product links to Telegram:', error.message);
  }
}

async function shortenLink(link) {
    try {
      const response = await axios.post('https://api-ssl.bitly.com/v4/shorten', {
        long_url: link
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bitlyAccessToken}`
        }
      });
  
      return response.data.link;
    } catch (error) {
      console.error('Error shortening link:', error.message);
      return link; // Return the original link if there was an error
    }
  }
  
// Call the function to get the product links and send them to the Telegram bot
getProductLinks();

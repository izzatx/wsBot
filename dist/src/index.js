"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
const venom_bot_1 = require("venom-bot");
const puppeteer_1 = __importDefault(require("puppeteer"));
// Replace these with actual group IDs
const groupAID = "120363391498432136@g.us"; // Group A hantar lunk MEDINA
const groupBID = "120363392164588023@g.us"; // Group B MEDINA TACKLE MERKARI
// A counter to keep track of link order
let linkCounter = 1;
let sequencePrefix = "A"; // Default prefix
const forwardedLinksGlobal = new Set(); // Global history of forwarded links
async function initializeBot() {
    try {
        const client = await (0, venom_bot_1.create)("whatsapp-bot", (asciiQR) => {
            logger_1.logger.info("QR Code:", asciiQR);
        }, (statusSession) => {
            logger_1.logger.info("Session status:", statusSession);
        }, {
            folderNameToken: "tokens",
            headless: "new",
        });
        return client;
    }
    catch (error) {
        logger_1.logger.error("Error initializing Venom Bot:", error);
        return null;
    }
}
async function SendMessage(client) {
    const userID = "601111896401@c.us"; // Replace with the correct number
    const message = "Hello, good morning";
    try {
        await client.sendText(userID, message);
        logger_1.logger.info("Message from venom bot");
    }
    catch (error) {
        logger_1.logger.error("Failed to send message: %o", error);
    }
}
async function getValidDynamicImageUrl(link) {
    try {
        const itemId = link.split("/").pop();
        if (!itemId) {
            logger_1.logger.error("Invalid item ID in the link.");
            throw new Error("Invalid item ID in the link.");
        }
        logger_1.logger.info(`Extracted itemId: ${itemId}`);
        const browser = await puppeteer_1.default.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"], });
        const page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded" });
        logger_1.logger.info("Navigated to the link, waiting for the image container to load.");
        await page.waitForSelector("div.imageContainer__f8ddf3a2 picture img", {
            timeout: 5000,
        });
        const imageSrc = await page.evaluate(() => {
            const imageContainer = document.querySelector("div.imageContainer__f8ddf3a2");
            if (!imageContainer)
                return null;
            const imgElement = imageContainer.querySelector("picture img");
            if (!imgElement)
                return null;
            return imgElement.src || null;
        });
        await browser.close();
        if (imageSrc) {
            logger_1.logger.info(`Valid Image URL Found: ${imageSrc}`);
            return imageSrc;
        }
        else {
            logger_1.logger.warn("No matching image URL found in the container.");
            return null;
        }
    }
    catch (error) {
        logger_1.logger.error("Error extracting dynamic image URL:", error);
        return null;
    }
}
async function handleIncomingMessage(client, message) {
    try {
        logger_1.logger.info("Received:", message.body);
        if (message.body.toLowerCase() === "hi") {
            await client.sendText(message.from, "Hello! This is WhatsApp Bot.");
            logger_1.logger.info(`Replied to ${message.from}`);
        }
    }
    catch (error) {
        logger_1.logger.error("Error handling incoming message:", error);
    }
}
async function setupGroupMessageHandler(client) {
    client.onMessage(async (message) => {
        try {
            if (message.from !== groupAID) {
                logger_1.logger.info("Message is not from Group A.");
                return;
            }
            logger_1.logger.info("Message is from Group A.");
            const messageBody = message.body.toLowerCase();
            if (await handlePrefixChange(client, message, messageBody)) {
                return;
            }
            if (message.body.includes("✅")) {
                await processLinkMessage(client, message);
            }
            else {
                logger_1.logger.info("No ✅ emoji found in the message.");
            }
        }
        catch (error) {
            logger_1.logger.error("Error handling message in Group A:", error);
        }
    });
}
async function handlePrefixChange(client, message, messageBody) {
    if (!messageBody.startsWith("bot change ")) {
        return false; // Not a prefix change command
    }
    const newCommand = message.body.slice(10).trim(); // Extract after "bot change "
    const match = newCommand.match(/^([A-Za-z]+)(\d+)?$/); // Match prefix and optional number
    if (match) {
        const newPrefix = match[1]; // Extract the prefix (e.g., "AB")
        const startingNumber = match[2] ? parseInt(match[2], 10) : 1; // Extract or default to 1
        sequencePrefix = newPrefix; // Update the prefix
        linkCounter = startingNumber; // Update the starting number
        logger_1.logger.info(`Sequence prefix updated to: ${sequencePrefix} and starting number set to: ${linkCounter}`);
        await client.sendText(message.from, `Sequence prefix changed to: ${sequencePrefix}, starting from: ${linkCounter}.`);
    }
    else {
        logger_1.logger.warn("Invalid prefix or format provided in the command.");
        await client.sendText(message.from, "Invalid format. Usage: bot change <prefix><startingNumber> (e.g., bot change AB7).");
    }
    return true; // Prefix change handled
}
async function processLinkMessage(client, message) {
    try {
        logger_1.logger.info("✅ emoji detected in the message.");
        const link = await extractMessageLink(message);
        if (!link) {
            logger_1.logger.warn("No valid link found in the message or quoted message.");
            return;
        }
        if (forwardedLinksGlobal.has(link)) {
            logger_1.logger.info(`Link "${link}" already processed globally. Skipping.`);
            return;
        }
        forwardedLinksGlobal.add(link);
        await forwardMessageWithImage(client, link);
    }
    catch (error) {
        logger_1.logger.error("Error processing link message:", error);
    }
}
async function extractMessageLink(message) {
    if (message.quotedMsgObj) {
        logger_1.logger.info("Quoted message detected.");
        return extractLink(message.quotedMsgObj.body || "");
    }
    return extractLink(message.body);
}
async function forwardMessageWithImage(client, link) {
    try {
        const imageUrl = await getValidDynamicImageUrl(link);
        logger_1.logger.info("image URL: ", imageUrl);
        const forwardMessage = `${sequencePrefix}${linkCounter}\n${link}`;
        linkCounter++;
        if (imageUrl) {
            await client.sendImage(groupBID, imageUrl, "image.jpg", forwardMessage);
            logger_1.logger.info(`Forwarded to Group B with image and caption: ${forwardMessage}`);
        }
        else {
            logger_1.logger.warn("Failed to find a valid dynamic image URL. Sending link only.");
            await client.sendText(groupBID, forwardMessage);
        }
    }
    catch (error) {
        logger_1.logger.error("Error forwarding message with image:", error);
    }
}
async function extractLink(message) {
    logger_1.logger.info(`Extracting link from message: ${message}`);
    const match = message.match(/https?:\/\/[^\s]+/);
    logger_1.logger.info(`Extracted link: ${match ? match[0] : "No link found"}`);
    return match ? match[0] : null;
}
async function getGroupIDs(client) {
    try {
        // Fetch all chats
        const chats = await client.getAllChats();
        // Filter group chats
        const groupChats = chats.filter((chat) => chat.id._serialized.endsWith("@g.us"));
        for (const group of groupChats) {
            const chatDetails = await client.getChatById(group.id._serialized);
            // Use a safe fallback for group name
            const groupName = chatDetails.name ||
                (chatDetails.groupMetadata &&
                    chatDetails.groupMetadata.name) ||
                "Unnamed Group";
            logger_1.logger.info(`Group Name: ${groupName}, Group ID: ${group.id._serialized}`);
        }
        logger_1.logger.info(`Found ${groupChats.length} group(s).`);
    }
    catch (error) {
        logger_1.logger.error("Error fetching group IDs:", error);
    }
}
async function main() {
    const client = await initializeBot();
    if (client) {
        await getGroupIDs(client);
        await setupGroupMessageHandler(client);
    }
    else {
        logger_1.logger.error("Failed to initialize the bot, exiting.");
    }
}
main();

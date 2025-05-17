"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
const venom_bot_1 = require("venom-bot");
const groupAID = "120363193416397252@g.us";
const groupBID = "120363357006932873@g.us";
let linkCounter = 1;
let sequencePrefix = "A";
const forwardedLinksGlobal = new Set();
async function initializeBot() {
    try {
        const client = await (0, venom_bot_1.create)("whatsapp-bot", (asciiQR) => {
            logger_1.logger.info("QR Code:", asciiQR);
        }, (statusSession) => {
            logger_1.logger.info("Session status:", statusSession);
        }, {
            folderNameToken: "tokens",
            headless: "new",
            browserArgs: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-background-timer-throttling",
                "--disable-renderer-backgrounding",
                "--disable-web-security",
                "--no-zygote",
                "--single-process",
                "--no-first-run",
                "--no-default-browser-check",
            ],
        });
        return client;
    }
    catch (error) {
        logger_1.logger.error("Error initializing Venom Bot:", error);
        return null;
    }
}
async function handleIncomingMessage(client, message) {
    try {
        logger_1.logger.info("Received:", message.body);
        if (message.body.toLowerCase() === "hi") {
            await client.sendText(message.from, "Hello! This is WhatsApp Bot.");
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
                return;
            }
            const messageBody = message.body.toLowerCase();
            if (await handlePrefixChange(client, message, messageBody)) {
                return;
            }
            if (message.body.includes("✅")) {
                await processLinkMessage(client, message);
            }
        }
        catch (error) {
            logger_1.logger.error("Error handling message in Group A:", error);
        }
    });
}
async function handlePrefixChange(client, message, messageBody) {
    if (!messageBody.startsWith("bot change ")) {
        return false;
    }
    const newCommand = messageBody.replace(/^bot change /i, "").trim();
    // Ensure correct prefix and number extraction
    const match = newCommand.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) {
        logger_1.logger.warn("Invalid format provided.");
        await client.sendText(message.from, "Invalid format. Usage: bot change <prefix><startingNumber> (e.g., bot change AB7).");
        return true;
    }
    sequencePrefix = match[1].toUpperCase(); // Convert to uppercase
    linkCounter = parseInt(match[2], 10); // Convert number properly
    // Force logging output
    logger_1.logger.info(`Updated prefix: ${sequencePrefix}, Starting from: ${linkCounter}`);
    logger_1.logger.info(`Updated prefix: ${sequencePrefix}, Starting from: ${linkCounter}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await client.sendText(message.from, `Sequence prefix updated to ${sequencePrefix}, starting from ${linkCounter}.`);
    return true;
}
async function processLinkMessage(client, message) {
    try {
        const link = await extractMessageLink(message);
        if (!link || forwardedLinksGlobal.has(link)) {
            return;
        }
        forwardedLinksGlobal.add(link);
        await forwardMessage(client, link);
    }
    catch (error) {
        logger_1.logger.error("Error processing link message:", error);
    }
}
async function extractMessageLink(message) {
    if (message.quotedMsgObj) {
        return extractLink(message.quotedMsgObj.body || "");
    }
    return extractLink(message.body);
}
// async function forwardMessageWithImage(client: Whatsapp, link: string) {
//   try {
//     const imageUrl = await getValidDynamicImageUrl(link);
//     const forwardMessage = `${sequencePrefix}${linkCounter}\n${link}`;
//     linkCounter++;
//     if (imageUrl) {
//       await client.sendImage(groupBID, imageUrl, "image.jpg", forwardMessage);
//     } else {
//       await client.sendText(groupBID, forwardMessage);
//     }
//   } catch (error) {
//     logger.error("Error forwarding message with image:", error);
//   }
// }
async function forwardMessage(client, link) {
    try {
        const forwardMessage = `${sequencePrefix}${linkCounter}\n${link}`;
        linkCounter++;
        await client.sendText(groupBID, forwardMessage);
    }
    catch (error) {
        logger_1.logger.error("Error forwarding message with image:", error);
    }
}
async function extractLink(message) {
    const match = message.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
}
// async function getValidDynamicImageUrl(link: string): Promise<string | null> {
//   let driver = await new Builder().forBrowser("chrome").build();
//   try {
//     await driver.get(link);
//     const imageElement = await driver.wait(
//       until.elementLocated(By.css("div.imageContainer__f8ddf3a2 picture img")),
//       5000,
//     );
//     const imageSrc = await imageElement.getAttribute("src");
//     await driver.quit();
//     return imageSrc || null;
//   } catch (error) {
//     logger.error("Error extracting dynamic image URL:", error);
//     await driver.quit();
//     return null;
//   }
// }
async function getGroupIDs(client) {
    try {
        const chats = await client.getAllChats();
        const groupChats = chats.filter((chat) => chat.id._serialized.endsWith("@g.us"));
        for (const group of groupChats) {
            const chatDetails = await client.getChatById(group.id._serialized);
            const groupName = chatDetails.name || "Unnamed Group";
            logger_1.logger.info(`Group Name: ${groupName}, Group ID: ${group.id._serialized}`);
        }
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

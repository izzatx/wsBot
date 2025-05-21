import { logger } from "../utils/logger";
import { create, Whatsapp, Message, Chat } from "venom-bot";
import "dotenv/config";

// require for env file
require("dotenv").config();

const groupAID = process.env.GROUP_A_ID || "";
const groupBID = process.env.GROUP_B_ID || "";

let linkCounter = 1;
let sequencePrefix = "A";
const forwardedLinksGlobal = new Set<string>();

async function initializeBot(): Promise<Whatsapp | null> {
  try {
    const client = await create(
      "whatsapp-bot",
      (asciiQR) => {
        logger.info("QR Code:", asciiQR);
      },
      (statusSession) => {
        logger.info("Session status:", statusSession);
      },
      {
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
      },
    );
    return client;
  } catch (error) {
    logger.error("Error initializing Venom Bot:", error);
    return null;
  }
}

async function handleIncomingMessage(client: Whatsapp, message: Message) {
  try {
    logger.info("Received:", message.body);
    if (message.body.toLowerCase() === "hi") {
      await client.sendText(message.from, "Hello! This is WhatsApp Bot.");
    }
  } catch (error) {
    logger.error("Error handling incoming message:", error);
  }
}

async function setupGroupMessageHandler(client: Whatsapp) {
  client.onMessage(async (message: Message) => {
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
    } catch (error) {
      logger.error("Error handling message in Group A:", error);
    }
  });
}

async function handlePrefixChange(
  client: Whatsapp,
  message: Message,
  messageBody: string,
): Promise<boolean> {
  if (!messageBody.startsWith("bot change ")) {
    return false;
  }

  const newCommand = messageBody.replace(/^bot change /i, "").trim();

  // Ensure correct prefix and number extraction
  const match = newCommand.match(/^([A-Za-z]+)(\d+)$/);

  if (!match) {
    logger.warn("Invalid format provided.");
    await client.sendText(
      message.from,
      "Invalid format. Usage: bot change <prefix><startingNumber> (e.g., bot change AB7).",
    );
    return true;
  }

  sequencePrefix = match[1].toUpperCase(); // Convert to uppercase
  linkCounter = parseInt(match[2], 10); // Convert number properly

  // Force logging output
  logger.info(
    `Updated prefix: ${sequencePrefix}, Starting from: ${linkCounter}`,
  );
  logger.info(
    `Updated prefix: ${sequencePrefix}, Starting from: ${linkCounter}`,
  );

  await new Promise((resolve) => setTimeout(resolve, 500));
  await client.sendText(
    message.from,
    `Sequence prefix updated to ${sequencePrefix}, starting from ${linkCounter}.`,
  );

  return true;
}

async function processLinkMessage(client: Whatsapp, message: Message) {
  try {
    const link = await extractMessageLink(message);
    if (!link || forwardedLinksGlobal.has(link)) {
      return;
    }
    forwardedLinksGlobal.add(link);
    await forwardMessage(client, link);
  } catch (error) {
    logger.error("Error processing link message:", error);
  }
}

async function extractMessageLink(message: Message): Promise<string | null> {
  if (message.quotedMsgObj) {
    return extractLink((message.quotedMsgObj as any).body || "");
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

async function forwardMessage(client: Whatsapp, link: string) {
  try {
    const forwardMessage = `${sequencePrefix}${linkCounter}\n${link}`;
    linkCounter++;
    await client.sendText(groupBID, forwardMessage);
  } catch (error) {
    logger.error("Error forwarding message with image:", error);
  }
}

async function extractLink(message: string): Promise<string | null> {
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

async function getGroupIDs(client: Whatsapp) {
  try {
    const chats = await client.getAllChats();
    const groupChats = (chats as Chat[]).filter((chat) =>
      chat.id._serialized.endsWith("@g.us"),
    );
    for (const group of groupChats) {
      const chatDetails = await client.getChatById(group.id._serialized);
      const groupName = chatDetails.name || "Unnamed Group";
      logger.info(
        `Group Name: ${groupName}, Group ID: ${group.id._serialized}`,
      );
    }
  } catch (error) {
    logger.error("Error fetching group IDs:", error);
  }
}

async function main() {
  const client = await initializeBot();
  if (client) {
    await getGroupIDs(client);
    await setupGroupMessageHandler(client);
  } else {
    logger.error("Failed to initialize the bot, exiting.");
  }
}

main();

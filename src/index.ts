import { logger } from "../utils/logger";
import { create, Whatsapp, Message, Chat } from "venom-bot";
import { Builder, By, until } from "selenium-webdriver";

// Replace these with actual group IDs
const groupAID = "120363193416397252@g.us"; // Group A
const groupBID = "120363357006932873@g.us"; // Group B

// Counter for numbering forwarded messages
let linkCounter = 1;
let sequencePrefix = "A"; // Default prefix

const forwardedLinksGlobal = new Set<string>(); // Global history of forwarded links

async function initializeBot(): Promise<Whatsapp | null> {
  try {
    const client = await create(
      "whatsapp-bot",
      (base64Qr, asciiQR) => {
        console.log("Scan the QR code below:");
        console.log(asciiQR);
      },
      (statusSession) => {
        console.log("Session Status:", statusSession);
      },
      {
        headless: "new", // Run in headless mode
        browserArgs: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--remote-debugging-port=9222",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-sync",
          "--hide-scrollbars",
          "--mute-audio",
        ],
        folderNameToken: "tokens", // Ensure token storage
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
      logger.info(`Replied to ${message.from}`);
    }
  } catch (error) {
    logger.error("Error handling incoming message:", error);
  }
}

async function setupGroupMessageHandler(client: Whatsapp) {
  client.onMessage(async (message: Message) => {
    try {
      if (message.from !== groupAID) {
        logger.info("Message is not from Group A.");
        return;
      }

      logger.info("Message is from Group A.");

      if (message.body.includes("✅")) {
        await processLinkMessage(client, message);
      } else {
        logger.info("No ✅ emoji found in the message.");
      }
    } catch (error) {
      logger.error("Error handling message in Group A:", error);
    }
  });
}

async function processLinkMessage(client: Whatsapp, message: Message) {
  try {
    logger.info("✅ emoji detected in the message.");

    const link = await extractMessageLink(message);
    if (!link) {
      logger.warn("No valid link found in the message.");
      return;
    }

    if (forwardedLinksGlobal.has(link)) {
      logger.info(`Link "${link}" already processed globally. Skipping.`);
      return;
    }

    forwardedLinksGlobal.add(link);
    await forwardMessageWithImage(client, link);
  } catch (error) {
    logger.error("Error processing link message:", error);
  }
}

async function extractMessageLink(message: Message): Promise<string | null> {
  return extractLink(message.body);
}

async function forwardMessageWithImage(client: Whatsapp, link: string) {
  try {
    const imageUrl = await getValidDynamicImageUrl(link);
    logger.info("image URL: ", imageUrl);

    const forwardMessage = `${sequencePrefix}${linkCounter}\n${link}`;
    linkCounter++;

    if (imageUrl) {
      await client.sendImage(groupBID, imageUrl, "image.jpg", forwardMessage);
      logger.info(
        `Forwarded to Group B with image and caption: ${forwardMessage}`,
      );
    } else {
      logger.warn(
        "Failed to find a valid dynamic image URL. Sending link only.",
      );
      await client.sendText(groupBID, forwardMessage);
    }
  } catch (error) {
    logger.error("Error forwarding message with image:", error);
  }
}

async function extractLink(message: string): Promise<string | null> {
  const match = message.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

async function getValidDynamicImageUrl(link: string): Promise<string | null> {
  let driver = await new Builder().forBrowser("chrome").build();
  try {
    await driver.get(link);
    logger.info("Navigated to the link, waiting for image to load.");

    const imageElement = await driver.wait(
      until.elementLocated(By.css("div.imageContainer__f8ddf3a2 picture img")),
      5000,
    );

    const imageSrc = await imageElement.getAttribute("src");
    await driver.quit();

    return imageSrc ? imageSrc : null;
  } catch (error) {
    logger.error("Error extracting dynamic image URL:", error);
    await driver.quit();
    return null;
  }
}

async function main() {
  const client = await initializeBot();
  if (client) {
    await setupGroupMessageHandler(client);
  } else {
    logger.error("Failed to initialize the bot, exiting.");
  }
}

main();

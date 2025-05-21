# 🤖 WhatsApp Group Bot (TypeScript)

A TypeScript-based WhatsApp bot that automates message handling between WhatsApp groups.  
Built using [venom-bot](https://github.com/orkestral/venom) and powered by `.env` configuration.

---

## 🚀 Features

- 📥 Auto-reply to incoming messages
- 🔄 Forward messages between Group A and Group B
- ⚙️ Fully customizable group IDs via `.env`
- 🔐 Environment variable support using `dotenv`
- 📦 Written in clean, modular TypeScript

---

## 🧱 Tech Stack

- 🟦 TypeScript (strict mode)
- 🧰 Node.js + `venom-bot`
- Railway for cloud deployment

---

## 📂 Project Structure

```bash
whatsappBot/
├── src/
│   └── index.ts          # Main entry point
├── .env                  # Group ID settings (do NOT commit)
├── .gitignore            # Includes node_modules, .env
├── package.json          # Scripts and dependencies
└── tsconfig.json         # TypeScript settings
```

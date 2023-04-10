require("dotenv").config();

const { getCryptoPriceInUSD, generateCryptoChart } = require("./modules/price");

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);
let cryptoSymbol = "bitcoin";

bot.on("message", async (ctx) => {
  try {
    const { message_id, from, chat, date, text } = ctx.message;

    console.log("@" + (from.username || "X") + " - " + chat.id + " - " + text);

    if (text.startsWith("/")) {
      const [command, ...args] = text.split(" ");

      if (command === "/start") {
        ctx.reply(`Hello ${from.first_name}!`);
      }

      if (command === "/price") {
        if (args[0]) {
          cryptoSymbol = args[0].toLowerCase() || cryptoSymbol;
        }

        const price = await getCryptoPriceInUSD(cryptoSymbol);

        ctx.reply(`${cryptoSymbol} is $${price} USD`);
      }

      if (command === "/chart") {
        if (args[0]) {
          cryptoSymbol = args[0].toLowerCase() || cryptoSymbol;
        }

        const imageBuffer = await generateCryptoChart(cryptoSymbol);

        ctx.replyWithPhoto({ source: imageBuffer });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

bot.launch();

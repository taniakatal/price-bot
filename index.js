require("dotenv").config();

const { getCryptoPriceInUSD, generateCryptoChart } = require("./modules/price");

const { Telegraf } = require("telegraf");
const mongoose = require("mongoose");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);
let cryptoSymbol = "bitcoin";

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const alertSchema = new mongoose.Schema({
  symbol: String,
  price: Number,
  type: { type: String, enum: ["above", "below"] },
  chatId: Number,
});

const Alert = mongoose.model("Alert", alertSchema);

const priceSchema = new mongoose.Schema(
  {
    chatId: Number,
    symbol: String,
    lastPrice: Number,
  },
  { timestamps: { createdAt: "createdAt" }, expireAfterSeconds: 24 * 60 * 60 }
);

const Price = mongoose.model("Price", priceSchema);

async function getPriceChange(chatId, symbol, currentPrice) {
  const priceData = await Price.findOne({ chatId, symbol });

  if (priceData) {
    const lastPrice = priceData.lastPrice;
    const priceChange = currentPrice - lastPrice;
    const priceChangePercent = (currentPrice / lastPrice - 1) * 100;
    const priceChangeText =
      priceChange > 0 ? `+${priceChange.toFixed(2)}` : priceChange.toFixed(2);
    const priceChangePercentText =
      priceChangePercent > 0
        ? `+${priceChangePercent.toFixed(2)}%`
        : `${priceChangePercent.toFixed(2)}%`;

    if (priceChangeText) {
      return `Price change since last check: ${priceChangeText} USD (${priceChangePercentText})`;
    } else {
      return "";
    }
  } else {
    return "";
  }
}

async function checkAlerts() {
  console.log("Running Check ALerts ");

  const symbols = await Alert.distinct("symbol");

  for (const symbol of symbols) {
    const currentPrice = await getCryptoPriceInUSD(symbol);
    const alertsAbove = await Alert.find({
      symbol,
      type: "above",
      price: { $lte: currentPrice },
    });
    const alertsBelow = await Alert.find({
      symbol,
      type: "below",
      price: { $gte: currentPrice },
    });

    for (const alert of [...alertsAbove, ...alertsBelow]) {
      const typeText =
        alert.type === "above" ? "reached or exceeded" : "fell or reached";
      bot.telegram.sendMessage(
        alert.chatId,
        `🚨 ${symbol.toUpperCase()} ${typeText} your price alert of $${
          alert.price
        } USD. Current price: $${currentPrice} USD`
      );
      await Alert.deleteOne({ _id: alert._id });
    }

    const priceData = await Price.findOneAndUpdate(
      { chatId: chatId },
      { lastPrice: currentPrice },
      { upsert: true, new: true }
    );

    if (priceData) {
      const priceChangeText = await getPriceChange(
        chatId,
        symbol,
        currentPrice
      );

      if (priceChangeText) {
        bot.telegram.sendMessage(
          alert.chatId,
          `${symbol.toUpperCase()} is $${currentPrice} USD. 
          ${priceChangeText}`
        );
      }
    }
  }
}

setInterval(checkAlerts, 33 * 1000);

bot.on("message", async (ctx) => {
  const { message_id, from, chat, date, text } = ctx.message;

  console.log("@" + (from.username || "X") + " - " + chat.id + " - " + text);

  try {
    if (text.startsWith("/")) {
      const [command, ...args] = text.split(" ");

      if (command === "/start") {
        const welcomeMessage = `Hello ${from.first_name}! Here are the available commands:
  
  /price [SYMBOL] - Get the current price of the specified cryptocurrency in USD.
  /chart [SYMBOL] - Get a chart of the specified cryptocurrency's price history.
  /alert SYMBOL PRICE - Set a price alert for the specified cryptocurrency when it reaches or falls below the given price in USD.
  /viewalerts - View all your active price alerts.
  
  Replace [SYMBOL] with the cryptocurrency symbol, like BTC for Bitcoin or ETH for Ethereum. If no symbol is provided, the default is Bitcoin.`;
        ctx.reply(welcomeMessage);
      }

      if (command === "/price") {
        if (args[0]) {
          cryptoSymbol = args[0].toLowerCase();
        }

        const currentPrice = await getCryptoPriceInUSD(cryptoSymbol);
        const priceChangeText = await getPriceChange(
          chat.id,
          cryptoSymbol,
          currentPrice
        );

        const priceData = new Price({
          chatId: chat.id,
          symbol: cryptoSymbol,
          lastPrice: currentPrice,
        });

        await priceData.save();

        ctx.reply(
          `${cryptoSymbol.toUpperCase()} is $${currentPrice} USD. ${priceChangeText}`
        );
      }

      if (command === "/chart") {
        if (args[0]) {
          cryptoSymbol = args[0].toLowerCase() || cryptoSymbol;
        }

        const imageBuffer = await generateCryptoChart(cryptoSymbol);

        ctx.replyWithPhoto({ source: imageBuffer });
      }

      if (command === "/alert") {
        if (args.length >= 3) {
          const symbol = args[0].toLowerCase();
          const price = parseFloat(args[1]);
          const type = args[2].toLowerCase() === "above" ? "above" : "below";

          const alert = new Alert({ symbol, price, type, chatId: chat.id });
          await alert.save();

          ctx.reply(
            `Price alert set for ${symbol.toUpperCase()} ${
              type === "above" ? "above" : "below"
            } $${price} USD`
          );
        } else {
          ctx.reply(
            "Please use the following format: /alert SYMBOL PRICE ABOVE/BELOW"
          );
        }
      }

      if (command === "/viewalerts") {
        const alerts = await Alert.find({ chatId: chat.id });

        if (alerts.length > 0) {
          let alertMessage = "Your active alerts:\n\n";
          alerts.forEach((alert) => {
            alertMessage += `ID: ${
              alert._id
            } 🔔 ${alert.symbol.toUpperCase()} at $${alert.price} USD\n`;
          });
          ctx.reply(alertMessage);
        } else {
          ctx.reply("You have no active alerts.");
        }
      }

      if (command === "/cancelalert") {
        if (args[0]) {
          const alertId = args[0];
          const alert = await Alert.findOne({ _id: alertId, chatId: chat.id });

          if (alert) {
            await Alert.deleteOne({ _id: alertId });
            ctx.reply(
              `Alert for ${alert.symbol.toUpperCase()} at $${
                alert.price
              } USD has been cancelled.`
            );
          } else {
            ctx.reply(
              "Invalid alert ID or the alert does not belong to this chat."
            );
          }
        } else {
          ctx.reply("Please use the following format: /cancelalert ALERT_ID");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
});

bot.launch();

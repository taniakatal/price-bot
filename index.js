require("dotenv").config();
const axios = require("axios");

const { handleIfStatements } = require("./modules/statement");
const {
  getPrice,
  generateCryptoChart,
  fetchTopLosersAndGainers,
  getCryptocurrencyInfo,
  getTrendingcrypto,
  getExchangeRate,
 
} = require("./modules/price");
const { Telegraf, Markup } = require("telegraf");

const mongoose = require("mongoose");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);
let cryptoSymbol = "bitcoin";

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const feedbackSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  feedback: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 200,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

const historySchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  command: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const History = mongoose.model("History", historySchema);

const userSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

const cryptoSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  cryptoSymbol: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const Crypto = mongoose.model("Crypto", cryptoSchema);

const alertSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: ["above", "below"],
    required: true,
  },
  chatId: {
    type: Number,
    required: true,
  },
});

const Alert = mongoose.model("Alert", alertSchema);

async function checkAlerts() {
  const symbols = await Alert.distinct("symbol");

  for (const symbol of symbols) {
    const currentPrice = await getPrice(symbol);
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
  }
}

setInterval(checkAlerts, 60000);

bot.use((ctx, next) => {
  // Get the chat ID, user ID, and command name
  const chatId = ctx.chat.id;
  const command = ctx.message.text.split(" ")[0]; // Get the first word of the message as the command name

  // Save the history to MongoDB
  const newHistory = new History({ chatId, command });
  newHistory.save().catch((err) => console.log(err));

  // Call the next middleware function or command handler
  return next();
});

bot.on("message", async (ctx) => {
  try {
    const { message_id, from, chat, date, text } = ctx.message;

    console.log("@" + (from.username || "X") + " - " + chat.id + " - " + text);

    handleIfStatements(ctx, text);

    if (text.startsWith("/")) {
      const [command, ...args] = text.split(" ");

      if (command === "/start") {
        const { first_name: firstName, last_name: lastName } = ctx.from;
        const user = new User({ chatId: ctx.chat.id, firstName, lastName });
        await user.save();

        const welcomeMessage = `Hello ${from.first_name}!`;
        ctx.reply(welcomeMessage);
      }

      if (command === "/help") {
        const helpMessage = `
          Hello! I am taniapricebot Bot. Here are some commands you can use:
      
          Available commands:
    - /price [symbol]: Get the current price of a cryptocurrency.
    - /pricechange [symbol]: Get the price change of a cryptocurrency.
    - /chart [symbol]: Get a chart of the price history for a cryptocurrency.
    - /fetchTop: Fetch the top gainers and top losers in the market.
    - /alert [symbol] [price] [above/below]: Set a price alert for a cryptocurrency.
    - /viewalerts: View your active price alerts.
    - /cancelalert [alertId]: Cancel a price alert.
    - /feedback [message]: Provide feedback to the bot.
    - /terms: Get definitions of common trading terms.
    - /theory: Get a brief overview of trading theory.
    - /trending: Get a list of trending cryptocurrencies.
  

          /calculate <expression> - Calculate a mathematical expression (e.g. /calculate 2 + 3)
      
          You can also ask me questions like:
          - "How are you?"
          - "What is your name?"
          - "Thank you"
          - "Bye"
          - "How do I get started with trading?"
          - "What is technical analysis?"
          - "What is fundamental analysis?"
      
          Note: Some commands may require additional arguments. Please follow the examples provided.
        `;
        ctx.reply(helpMessage);
      }

      if (command === "/price") {
        if (args[0]) {
          cryptoSymbol = args[0].toLowerCase() || cryptoSymbol;
        }

        const price = await getPrice(cryptoSymbol);

        // Save the cryptocurrency data to MongoDB
        const crypto = new Crypto({
          chatId: ctx.chat.id, // Add the chat ID to the schema
          cryptoSymbol,
          price,
          timestamp: new Date(),
        });

        await crypto.save();

        ctx.reply(`${cryptoSymbol} is $${price} USD`);
      }

      if (command === "/pricechange") {
        const args = ctx.message.text.split(" ");
        const cryptoSymbol = args[1];

        if (!cryptoSymbol) {
          ctx.reply(
            "Please specify a cryptocurrency symbol. Example usage: /pricechange BTC"
          );
          return;
        }

        // Find the latest cryptocurrency data for the symbol in MongoDB
        const latestCrypto = await Crypto.findOne({ cryptoSymbol })
          .sort("-timestamp")
          .exec();

        if (!latestCrypto) {
          ctx.reply(
            `Sorry, could not find any data for ${cryptoSymbol}. Please try again later.`
          );
          return;
        }

        // Find the previous cryptocurrency data for the symbol in MongoDB
        const previousCrypto = await Crypto.findOne({
          cryptoSymbol,
          chatId: ctx.chat.id, // Add the chat ID to the query
          timestamp: { $lt: latestCrypto.timestamp },
        })
          .sort("-timestamp")
          .exec();

        if (!previousCrypto) {
          ctx.reply(
            `Sorry, could not find any previous data for ${cryptoSymbol}. Please try again later.`
          );
          return;
        }

        const priceChange =
          ((latestCrypto.price - previousCrypto.price) / previousCrypto.price) *
          100;

        ctx.reply(
          `The price of ${cryptoSymbol} has changed by ${priceChange.toFixed(
            2
          )}% from ${previousCrypto.price} to ${latestCrypto.price}.`
        );
      }

      if (command === "/chart") {
        if (args[0]) {
          cryptoSymbol = args[0].toLowerCase() || cryptoSymbol;
        }

        const imageBuffer = await generateCryptoChart(cryptoSymbol);

        ctx.replyWithPhoto({ source: imageBuffer });
      }

      if (command === "/fetchTop") {
        try {
          const { topGainers, topLosers } = await fetchTopLosersAndGainers();

          const outputMessage = `
            <b>Top gainers:</b>
            ${topGainers
              .map(
                (coin) =>
                  `${coin.name} (${coin.symbol}): ${coin.price_change_percentage_24h}%`
              )
              .join("\n")}
            
            <b>Top losers:</b>
            ${topLosers
              .map(
                (coin) =>
                  `${coin.name} (${coin.symbol}): ${coin.price_change_percentage_24h}%`
              )
              .join("\n")}
          `;

          ctx.replyWithHTML(outputMessage);
        } catch (error) {
          console.error("Failed to fetch top losers and gainers:", error);
          ctx.reply("Sorry, I was unable to fetch the top losers and gainers.");
        }
      }

      if (command === "/cryptomarketdata") {
        const coinId = args[0];

        if (!coinId) {
          ctx.reply(
            "Please provide a valid cryptocurrency coin ID. Usage: /cryptomarketdata [COIN_ID]"
          );
          return;
        }

        try {
          const data = await getCryptocurrencyInfo(coinId);

          // Extract relevant information
          const name = data.name;
          const symbol = data.symbol;
          const price = data.market_data.current_price.usd;
          const marketCap = data.market_data.market_cap.usd;
          const circulatingSupply = data.market_data.circulating_supply;
          const totalSupply = data.market_data.total_supply;

          // Send the information as a message

          ctx.reply(`
        ${name} (${symbol})
        Price: $${price}
        Market Cap: $${marketCap}
        Circulating Supply: ${circulatingSupply}
        Total Supply: ${totalSupply}
        `);
        } catch (error) {
          console.error(error);
          ctx.reply(error.message);
        }
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
            } ${price && !isNaN(price) ? `$${price} USD` : ""}`
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

      if (command === "/feedback") {
        // Get the chat ID and feedback message
        const chatId = ctx.chat.id;
        const feedback = ctx.message.text.substring(9).trim(); // Remove the '/feedback' command from the message

        // Save the feedback to MongoDB
        const newFeedback = new Feedback({ chatId, feedback });
        newFeedback
          .save()
          .then(() => {
            // Reply with a confirmation message
            ctx.reply("Thank you for your feedback!");
          })
          .catch((err) => {
            // Reply with an error message
            ctx.reply(
              "Sorry, there was an error saving your feedback. Please try again later."
            );
            console.log(err);
          });
      }

      if (command === "/rates") {
        const args = ctx.message.text.split(" ");

        if (args.length !== 3) {
          ctx.reply(
            "Please use the following format: /rate <base_currency> <target_currency>"
          );
          return;
        }

        const baseCurrency = args[1].toUpperCase();
        const targetCurrency = args[2].toUpperCase();

        try {
          const rate = await getExchangeRate(baseCurrency, targetCurrency);
          ctx.reply(`1 ${baseCurrency} = ${rate} ${targetCurrency}`);
        } catch (error) {
          console.log(error);
          ctx.reply("An error occurred while fetching the exchange rate.");
        }
      }

      if (command === "/terms") {
        // Provide definitions of common trading terms
        const terms = `
          Common trading terms:
          - Bullish: When the market is expected to rise in price
          - Bearish: When the market is expected to fall in price
          - Long: When a trader buys a security with the expectation that it will rise in price
          - Short: When a trader sells a security with the expectation that it will fall in price
          - Stop loss: An order to sell a security at a specific price in order to limit losses
          - Take profit: An order to sell a security at a specific price in order to lock in profits
          - Resistance: A price level at which a security has difficulty breaking above
          - Support: A price level at which a security has difficulty breaking below
        `;
        ctx.reply(terms);
      }

      if (command === "/theory") {
        // Provide a brief overview of trading theory
        const theory = `
          Trading theory is the study of market behavior and price movement in order to make informed trading decisions. 
          The goal of trading is to buy low and sell high, but there are many factors that can influence market prices. 
          Successful traders use technical analysis, fundamental analysis, and risk management strategies to maximize profits and minimize losses.
        `;
        ctx.reply(theory);
      }

      if (command === "/trending") {
        const trendingCryptocurrencies = await getTrendingcrypto();
        if (trendingCryptocurrencies.length > 0) {
          const message = trendingCryptocurrencies
            .map((coin) => `🔸 ${coin.item.name} (${coin.item.symbol})`)
            .join("\n");
          ctx.replyWithHTML(`Trending Cryptocurrencies:\n\n${message}`);
        } else {
          ctx.reply(
            "Failed to fetch trending cryptocurrencies. Please try again later."
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
});

bot.launch();

require("dotenv").config();

const {
  getPrice,
  generateCryptoChart,fetchTopLosersAndGainers
} = require("./modules/price");

const { Telegraf } = require("telegraf");
const mongoose = require("mongoose");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);
let cryptoSymbol= "bitcoin";

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const feedbackSchema = new mongoose.Schema({
  chatId: { type: Number, required: true },
  feedback: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);


const userSchema = new mongoose.Schema({
  chatId: String
});

const User = mongoose.model('User', userSchema);

const cryptoSchema = new mongoose.Schema({
  chatId: String,
  cryptoSymbol: String,
  price: Number,
  timestamp: Date
});

const Crypto = mongoose.model('Crypto', cryptoSchema);


const alertSchema = new mongoose.Schema({
  symbol: String,
  price: Number,
  type: { type: String, enum: ["above", "below"] },
  chatId: Number,
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

bot.on("message", async (ctx) => {
  try {
    const { message_id, from, chat, date, text } = ctx.message;

    console.log("@" + (from.username || "X") + " - " + chat.id + " - " + text);

    if (text.startsWith("/")) {
      const [command, ...args] = text.split(" ");

      if (command === "/start") {

        const user = new User({ chatId: ctx.chat.id });
        await user.save();
      

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
      cryptoSymbol = args[0].toLowerCase() || cryptoSymbol;
    }
  
    const price = await getPrice(cryptoSymbol);
  
    // Save the cryptocurrency data to MongoDB
    const crypto = new Crypto({
      chatId: ctx.chat.id, // Add the chat ID to the schema
      cryptoSymbol,
      price,
      timestamp: new Date()
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
      timestamp: { $lt: latestCrypto.timestamp }
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
      ((latestCrypto.price - previousCrypto.price) / previousCrypto.price) * 100;
  
    ctx.reply(
      `The price of ${cryptoSymbol} has changed by ${priceChange.toFixed(
        2
      )}% from ${previousCrypto.price} to ${latestCrypto.price}.`
    );
  }
  

      if(command === "/chart") {
        if (args[0]) {
          cryptoSymbol = args[0].toLowerCase() || cryptoSymbol;
        }

        const imageBuffer = await generateCryptoChart(cryptoSymbol);

        ctx.replyWithPhoto({ source: imageBuffer });
      }

      if(command==="/fetchTop") {
        try {
          const { topGainers, topLosers } = await fetchTopLosersAndGainers();
      
          const outputMessage = `
            <b>Top gainers:</b>
            ${topGainers.map((coin) => `${coin.name} (${coin.symbol}): ${coin.price_change_percentage_24h}%`).join('\n')}
            
            <b>Top losers:</b>
            ${topLosers.map((coin) => `${coin.name} (${coin.symbol}): ${coin.price_change_percentage_24h}%`).join('\n')}
          `;
      
          ctx.replyWithHTML(outputMessage);
        } catch (error) {
          console.error("Failed to fetch top losers and gainers:", error);
          ctx.reply('Sorry, I was unable to fetch the top losers and gainers.');
        }
      };

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

      if(command==='/feedback') {
        // Get the chat ID and feedback message
        const chatId = ctx.chat.id;
        const feedback = ctx.message.text.substring(9).trim(); // Remove the '/feedback' command from the message
      
        // Save the feedback to MongoDB
        const newFeedback = new Feedback({ chatId, feedback });
        newFeedback.save()
          .then(() => {
            // Reply with a confirmation message
            ctx.reply('Thank you for your feedback!');
          })
          .catch(err => {
            // Reply with an error message
            ctx.reply('Sorry, there was an error saving your feedback. Please try again later.');
            console.log(err);
          });
      }

    }
  } catch (error) {
    console.log(error);
  }
});

bot.launch();

require("dotenv").config();

const axios = require("axios");

const { Telegraf, Markup } = require("telegraf");

const { handleIfStatements } = require("./modules/statement");

const { checkAlerts, checkCrossover } = require("./modules/alertfn");

module.exports = {
  fetchTopLosersAndGainers,
  calculateSMA,
  getExchangeRate,
  getPrice,
  generateCryptoChart,
  getCryptocurrencyInfo,
  getTrendingcrypto,
  fetchPublicTreasuryInfo,
  fetchMarketData,
  determineSentiment,
} = require("./modules/price");

module.exports = {
  Feedback,
  History,
  User,
  Crypto,
  Crossover,
  Alert,
} = require("./modules/Schemas");

const bot = new Telegraf(process.env.TELEGRAMBOTAPI);

let cryptoSymbol = "bitcoin";
let userChatId = null;
let agentChatId = null;

// Schedule price alert every 60 secound
setInterval(checkAlerts, 60000);

// Schedule crossover check every  half hour
setInterval(checkCrossover, 1800000);

bot.use((ctx, next) => {
  // Get the chat ID, user ID, and command name
  const chatId = ctx.chat.id;
  const message = ctx.message.text;

  if (message.startsWith("/")) {
    const command = message.split(" ")[0]; // Get the first word of the message starting with "/"

    // Save the history to MongoDB
    const newHistory = new History({ chatId, command });
    newHistory.save().catch((err) => console.log(err));
  }

  // Call the next middleware function or command handler
  return next();
});

bot.use((ctx, next) => {
  const { message } = ctx;
  if (message && message.text && message.text.startsWith("/")) {
    const command = message.text.split(" ")[0].toLowerCase();
    const recognizedCommands = [
      "/start",
      "/help",
      "/price",
      "/trending",
      "/pricechange",
      "/chart",
      "/fetchTop",
      "/prediction",
      "/addalertforcrossover",
      "/removealertforcrossover",
      "/listalertforcrossover",
      "/sentiment",
      "/fetchTop",
      "/cryptomarketdata",
      "/alert",
      "/viewalerts",
      "/cancelalert",
      "/moonshot",
      "/whalewatch",
      "/feedback",
      "/handoff",
      "/mostsearched",
      "/convert",
      "/exchangerate",
      "/news",
    ];

    if (!recognizedCommands.includes(command)) {
      ctx.reply("Unrecognized command. Say what?");
    }
  }

  // Call the next middleware function or command handler
  return next();
});

bot.on("message", async (ctx) => {
  try {
    const { message_id, from, chat, date, text } = ctx.message;

    console.log("@" + (from.username || "X") + " - " + chat.id + " - " + text);

    userChatId = ctx.chat.id;

    handleIfStatements(ctx, text);

    if (text.startsWith("/")) {
      const [command, ...args] = text.split(" ");

      if (command === "/start") {
        const { id, first_name, last_name, username } = ctx.from;
        const existingUser = await User.findOne({ chatId: id });

        if (!existingUser) {
          const newUser = new User({
            chatId: id.toString(),
            firstName: first_name,
            lastName: last_name,
            timestamp: new Date(),
          });

          await newUser.save();
        }

        ctx.reply(`Hello, ${first_name}! Welcome to the bot.`);
      }

      if (command === "/help") {
        const helpMessage = `
          Hello! I am  CoinTeller Bot. Here are some commands you can use:
      
          Available commands:
          /price - Get the current price of a cryptocurrency.
          /pricechange - Get the price change of a cryptocurrency in the last 24 hours.
          /chart - Get the price chart of a cryptocurrency.
          /prediction - Get a price prediction for a cryptocurrency.
          /addalertforcrossover - Add a price alert for a cryptocurrency crossover.
          /removealertforcrossover - Remove a price alert for a cryptocurrency crossover.
          /listalertforcrossover - List all price alerts for cryptocurrency crossovers.
          /sentiment - Get the sentiment analysis of a cryptocurrency.
          /fetchTop - Fetch the top cryptocurrencies based on market capitalization.
          /cryptomarketdata - Get market data for a cryptocurrency.
          /alert - Set a price alert for a cryptocurrency.
          /viewalerts - View all active price alerts.
          /cancelalert - Cancel an active price alert.
          /moonshot - Discover potential moonshot cryptocurrencies.
          /whalewatch - Monitor whale activities in the cryptocurrency market.
          /feedback - Provide feedback about the bot.
          /trending - Get a list of trending coins.
          /mostsearched - Get a list of most searched coins.
          /convert - Convert between different currencies.
          /exchangerate - Get the exchange rate between two currencies.
          /news- financial news
          You can also ask me questions like:
          - "How are you?"
          - "What is your name?"
          - "Thank you"
          - "Bye"
          - "How do I get started with trading?"
          - "What is technical analysis?"
          - "What is fundamental analysis?"
          -"Tell me a joke" or requests for something funny
          -"Calculate [mathematical expression]": The bot will evaluate the given mathematical expression and provide the result.
          - You can also use emojis, and the bot will respond with appropriate reactions.
      
      
      
          Note: Some commands may require additional arguments. 
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
            "Please specify a cryptocurrency symbol. Example usage: /pricechange bitcoin"
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

      if (command === "/prediction") {
        const coin = ctx.message.text.split(" ")[1];

        if (!coin) {
          ctx.reply("Please provide a cryptocurrency symbol");
          return;
        }

        try {
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=30`
          );
          const prices = response.data?.prices;

          if (!prices) {
            ctx.reply("Unable to fetch price data for the cryptocurrency");
            return;
          }

          const predictionPeriod = 7; // Number of days to base the prediction on
          const predictionData = prices.slice(-predictionPeriod); // Get the last N days of data for prediction

          const smaPeriod = 5; // Number of days to calculate the SMA
          const sma = calculateSMA(predictionData, smaPeriod);

          const lastPrice = predictionData[predictionPeriod - 1][1]; // Assuming the price is at index 1
          const predictedPrice = sma[sma.length - 1];

          const prediction = `🔮 Prediction: The price of ${coin.toUpperCase()} is expected to ${
            predictedPrice > lastPrice ? "increase" : "decrease"
          } based on the ${smaPeriod}-day SMA.`;

          ctx.reply(prediction);
        } catch (error) {
          console.error("Error fetching cryptocurrency prediction:", error);
          ctx.reply(
            "Oops! Something went wrong while fetching the prediction. Please try again later."
          );
        }
      }

      if (command === "/addalertforcrossover") {
        const [_, cryptocurrency, type] = ctx.message.text.split(" ");

        if (!cryptocurrency || !type) {
          ctx.reply(
            "Please provide the cryptocurrency symbol and alert type (buy/sell)."
          );
          return;
        }

        const newCrossover = new Crossover({
          cryptocurrency: cryptocurrency.toUpperCase(),
          type: type.toLowerCase(),
          chatId: ctx.message.chat.id,
        });

        try {
          await newCrossover.save();
          ctx.reply(
            `Crossover alert for ${cryptocurrency.toUpperCase()} ${type.toUpperCase()} has been added.`
          );
        } catch (error) {
          console.error("Error saving crossover:", error);
          ctx.reply(
            "Oops! Something went wrong while saving the crossover. Please try again."
          );
        }
      }

      // Remove command
      if (command === "/removealertforcrossover") {
        const [_, cryptocurrency, type] = ctx.message.text.split(" ");

        if (!cryptocurrency || !type) {
          ctx.reply(
            "Please provide the cryptocurrency symbol and alert type (buy/sell)."
          );
          return;
        }

        try {
          await Crossover.deleteOne({
            cryptocurrency: cryptocurrency.toUpperCase(),
            type: type.toLowerCase(),
            chatId: ctx.message.chat.id,
          });
          ctx.reply(
            `Crossover alert for ${cryptocurrency.toUpperCase()} ${type.toUpperCase()} has been removed.`
          );
        } catch (error) {
          console.error("Error removing crossover:", error);
          ctx.reply(
            "Oops! Something went wrong while removing the crossover. Please try again."
          );
        }
      }

      // List command
      // if (command === "/listalertforcrossover") {
      //   try {
      //     const crossovers = await Crossover.find({
      //       chatId: ctx.message.chat.id,
      //     }).exec();
      //     let crossoverList = "Your crossovers:\n\n";
      //     crossovers.forEach((crossover) => {
      //       crossoverList += `- ${crossover.cryptocurrency.toUpperCase()} ${crossover.type.toUpperCase()}\n`;
      //     });
      //     ctx.reply(crossoverList);
      //   } catch (error) {
      //     console.error("Error retrieving crossovers:", error);
      //     ctx.reply(
      //       "Oops! Something went wrong while fetching the crossovers. Please try again."
      //     );
      //   }
      // }

      if (command === "/listalertforcrossover") {
        try {
          const crossovers = await Crossover.find({
            chatId: ctx.message.chat.id,
          }).exec();
      
          if (crossovers.length === 0) {
            ctx.reply("You have no crossovers set up.");
          } else {
            let crossoverList = "Your crossovers:\n\n";
            crossovers.forEach((crossover) => {
              crossoverList += `- ${crossover.cryptocurrency.toUpperCase()} ${crossover.type.toUpperCase()}\n`;
            });
            ctx.reply(crossoverList);
          }
        } catch (error) {
          console.error("Error retrieving crossovers:", error);
          ctx.reply(
            "Oops! Something went wrong while fetching the crossovers. Please try again."
          );
        }
      }
      
      // if (command === "/sentiment") {
      //   try {
      //     const response = await axios.get(
      //       "https://api.coingecko.com/api/v3/global"
      //     );
      //     const marketData = response.data.data.market_cap_percentage;
      //     const bitcoinDominance = marketData.btc;

      //     let sentimentText;
      //     if (bitcoinDominance > 50) {
      //       sentimentText = "The market sentiment is bullish 🐮";
      //     } else if (bitcoinDominance < 50) {
      //       sentimentText = "The market sentiment is bearish 🐻";
      //     } else {
      //       sentimentText = "The market sentiment is neutral 😐";
      //     }

      //     ctx.reply(sentimentText);
      //   } catch (error) {
      //     console.error("Error fetching market sentiment:", error);
      //     ctx.reply(
      //       "An error occurred while fetching the market sentiment. Please try again later."
      //     );
      //   }
      // }
      if (command === "/sentiment") {
        try {
          const bitcoinDominance = await fetchMarketData();
          const sentimentText = determineSentiment(bitcoinDominance);

          ctx.reply(sentimentText);
        } catch (error) {
          ctx.reply(
            "An error occurred while fetching the market sentiment. Please try again later."
          );
        }
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
            "Please provide a valid cryptocurrency coin ID. Usage: /cryptomarketdata CryptocurrencySymbol"
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

      if (command === "/moonshot") {
        try {
          // Fetch the top low-cap cryptocurrencies with significant price increase
          const response = await axios.get(
            "https://api.coingecko.com/api/v3/search/trending"
          );

          if (
            !response.data ||
            !response.data.coins ||
            response.data.coins.length === 0
          ) {
            throw new Error("Invalid or empty API response");
          }

          const trendingCoins = response.data.coins;

          // Filter out the low-cap cryptocurrencies
          const lowCapCoins = trendingCoins.filter(
            (coin) =>
              coin.item.market_cap_rank > 100 &&
              coin.item.market_cap_rank <= 500
          );

          if (lowCapCoins.length === 0) {
            throw new Error("No low-cap coins found");
          }

          // Randomly select a coin from the low-cap list
          const randomIndex = Math.floor(Math.random() * lowCapCoins.length);
          const moonshotCoin = lowCapCoins[randomIndex].item;

          // Retrieve additional information about the coin
          const coinInfoResponse = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${moonshotCoin.id}`
          );
          const coinInfo = coinInfoResponse.data;

          // Prepare the response message
          const message = `
            Moonshot Coin:
            Name: ${coinInfo.name}
            Symbol: ${coinInfo.symbol}
            Price: ${coinInfo.market_data.current_price.usd} USD
            Market Cap Rank: ${coinInfo.market_cap_rank}
            Website: ${coinInfo.links.homepage[0]}
          `;

          // Send the response to the user
          ctx.reply(message);
        } catch (error) {
          if (error.message === "No low-cap coins found") {
            ctx.reply("No low-cap coins found. Please try again later.");
          } else {
            console.error("Error fetching moonshot coin:", error);
            ctx.reply("Failed to fetch moonshot coin. Please try again later.");
          }
        }
      }

      if (command === "/whalewatch") {
        try {
          // Fetch the whale watch coins with trading volumes
          const response = await axios.get(
            "https://api.coingecko.com/api/v3/exchanges/binance"
          );
          const coins = response.data.tickers;

          if (!coins || coins.length === 0) {
            throw new Error("No whale watch coins found.");
          }

          // Sort the coins based on trading volume in descending order
          coins.sort((a, b) => {
            const volumeA = parseFloat(a.converted_volume.usd);
            const volumeB = parseFloat(b.converted_volume.usd);
            return volumeB - volumeA;
          });

          // Prepare the response message
          let message =
            "Whale Watch: Top Cryptocurrencies with High Trading Volume\n\n";

          coins.slice(0, 10).forEach((coin, index) => {
            const { base, target, converted_volume } = coin;
            const tradingVolume = parseFloat(
              converted_volume.usd
            ).toLocaleString();
            message += `${index + 1}. ${base}/${target}\n`;
            message += `   Trading Volume: $${tradingVolume}\n\n`;
          });

          // Send the response to the user
          ctx.reply(message);
        } catch (error) {
          console.error("Error fetching whale watch coins:", error);
          ctx.reply(
            "Failed to fetch whale watch coins. Please try again later."
          );
        }
      }

      // if (command === "/feedback") {
      //   // Get the chat ID and feedback message
      //   const chatId = ctx.chat.id;
      //   const feedback = ctx.message.text.substring(9).trim(); // Remove the '/feedback' command from the message

      //   if (feedback === "") {
      //     ctx.reply(
      //       "Please provide your feedback after the command. Example: /feedback Your feedback goes here"
      //     );
      //     return; // Stop further execution
      //   }

      //   // Save the feedback to MongoDB
      //   const newFeedback = new Feedback({ chatId, feedback });
      //   newFeedback
      //     .save()
      //     .then(() => {
      //       // Reply with a confirmation message
      //       ctx.reply("Thank you for your feedback!");
      //     })
      //     .catch((err) => {
      //       // Reply with an error message
      //       ctx.reply(
      //         "Sorry, there was an error saving your feedback. Please try again later."
      //       );
      //       console.log(err);
      //     });
      // }
      if (command === "/feedback") {
        // Get the chat ID and feedback message
        const chatId = ctx.chat.id;
        const feedback = ctx.message.text.substring(9).trim(); // Remove the '/feedback' command from the message

        if (feedback === "") {
          ctx.reply(
            "Please provide your feedback after the command. Example: /feedback Your feedback goes here"
          );
          return; // Stop further execution
        }

        // Save the feedback to MongoDB
        const newFeedback = new Feedback({ chatId, feedback });
        newFeedback
          .save()
          .then(() => {
            // Reply with a confirmation message
            ctx.reply("Thank you for your feedback!");
          })
          .catch((err) => {
            if (err.code === 11000) {
              // Duplicate key error, handle accordingly
              ctx.reply("You have already provided feedback. Thank you!");
            } else {
              // Reply with an error message
              ctx.reply(
                "Sorry, there was an error saving your feedback. Please try again later."
              );
              console.log(err);
            }
          });
      }

      if (command === "/handoff") {
        userChatId = ctx.chat.id;
        agentChatId = "-1001904350813"; // Replace with the chat ID of the human agent

        // Send a message to the user
        ctx.reply("Connecting you to a human agent. Please wait...");

        const userMessage = ctx.message.text;
        bot.telegram.sendMessage(
          agentChatId,
          `User: ${ctx.from.username}\n\n${userMessage}`
        );

        // Notify the human agent
        const notificationMessage = `New handoff from User: ${ctx.from.username}`;
        bot.telegram.sendMessage(agentChatId, notificationMessage);

        // Log the handoff event
        const logMessage = `Handoff initiated by User: ${ctx.from.username}`;
        console.log(logMessage);

        const inlineKeyboard = Markup.inlineKeyboard([
          Markup.button.url("Return to Bot", "https://t.me/CoinTellerbot"),
        ]);
        ctx.reply("You have been connected to a human agent.", inlineKeyboard);
      }

      // if (command === "/news") {
      //   try {
      //     const response = await axios.get(
      //       "https://api.coingecko.com/api/v3/news"
      //     );
      //     const newsArticles = response.data.articles;

      //     if (Array.isArray(newsArticles) && newsArticles.length > 0) {
      //       // Send the news articles to the user
      //       newsArticles.forEach((article) => {
      //         ctx.replyWithHTML(
      //           `<b>${article.title}</b>\n\n${article.description}\n<a href="${article.url}">Read more</a>\n`
      //         );
      //       });
      //     } else {
      //       ctx.reply("No news articles found.");
      //     }
      //   } catch (error) {
      //     console.error("Error fetching news:", error);
      //     ctx.reply(
      //       "An error occurred while fetching the news. Please try again later."
      //     );
      //   }
      // }

      // Command to fetch news
      if (command === "/news") {
        try {
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/news`
          );

          if (
            response.status === 200 &&
            response.data &&
            response.data.length > 0
          ) {
            const newsArticles = response.data;
            let newsMessage = "📰 Latest news from CoinGecko:\n\n";

            // Add the top 5 news articles to the message
            for (let i = 0; i < 5; i++) {
              const article = newsArticles[i];
              newsMessage += `🔹 ${article.title}\n${article.url}\n\n`;
            }

            ctx.reply(newsMessage);
          } else {
            ctx.reply(
              "❌ Unable to fetch news at the moment. Please try again later."
            );
          }
        } catch (error) {
          console.error("Error fetching news:", error);
          ctx.reply(
            "❌ An error occurred while fetching news. Please try again later."
          );
        }
      }

      if (command === "/convert") {
        const message = ctx.message.text;
        const [, amountStr, baseCurrency, , targetCurrency] =
          message.split(" ");

        // Validate input
        if (!amountStr || !baseCurrency || !targetCurrency) {
          ctx.reply(
            "Invalid command format. Please use /convert [amount] [base_currency] to [target_currency]"
          );
          return;
        }

        const amount = parseFloat(amountStr);

        if (isNaN(amount) || amount <= 0) {
          ctx.reply("Invalid amount. Please provide a valid numeric value.");
          return;
        }

        try {
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${baseCurrency}&vs_currencies=${targetCurrency}`
          );

          const targetPrice = response.data[baseCurrency][targetCurrency];
          const convertedAmount = amount * targetPrice;

          ctx.reply(
            `${amount} ${baseCurrency} is approximately ${convertedAmount} ${targetCurrency}`
          );
        } catch (error) {
          ctx.reply(
            "Error converting currencies. Please check the provided currencies and try again."
          );
        }
      }

      if (command === "/exchangerate") {
        const args = ctx.message.text.split(" ");

        if (args.length !== 3) {
          ctx.reply(
            "Please use the following format: /exchangerate <base_currency> <target_currency>"
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
      if (command === "/mostsearched") {
        try {
          const trendingCoinsResponse = await axios.get(
            "https://api.coingecko.com/api/v3/search/trending"
          );
          const coins = trendingCoinsResponse.data.coins;

          if (coins && Array.isArray(coins)) {
            const trendingCoinIds = coins.map((coin) => coin.item.id);

            const pricesResponse = await axios.get(
              `https://api.coingecko.com/api/v3/simple/price?ids=${trendingCoinIds.join(
                ","
              )}&vs_currencies=usd,inr`
            );
            const prices = pricesResponse.data;

            const formattedPrices = Object.entries(prices).map(
              ([coinId, values]) => {
                const usdPrice = values.usd.toFixed(2);
                const inrPrice = values.inr.toFixed(2);

                return `${coinId}: $${usdPrice} (₹${inrPrice})`;
              }
            );

            ctx.reply(
              `The most searched cryptocurrencies with prices in USD and Rupees are:\n\n${formattedPrices.join(
                "\n"
              )}`
            );
          } else {
            throw new Error("Invalid API response");
          }
        } catch (error) {
          console.error(
            "Error fetching most searched cryptocurrencies:",
            error.response.data
          );
          ctx.reply(
            "Oops! Something went wrong while fetching the data. Please try again later."
          );
        }
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
    ctx.reply("Oops! Something went wrong. Please try again later.");
  }
});

bot.on("message", (ctx) => {
  if (ctx.chat.id === agentChatId && ctx.message.reply_to_message) {
    // Forward agent's message to the user
    const userMessageId = ctx.message.reply_to_message.message_id;
    bot.telegram.forwardMessage(userChatId, agentChatId, userMessageId);
  }
});

bot.launch();

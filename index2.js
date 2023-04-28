require("dotenv").config();

const emojiRegex = require("emoji-regex");

const {
  getCryptoPriceInUSD,
  generateCryptoChart,
  getCryptocurrencyInfo,
  getTrendingcrypto,
  fetchPublicTreasuryInfo,
} = require("./modules/price");

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);
let cryptoSymbol = "bitcoin";

bot.on("message", async (ctx) => {
  try {
    const { message_id, from, chat, date, text } = ctx.message;

    console.log("@" + (from.username || "X") + " - " + chat.id + " - " + text);

    if (text.includes("how are you")) {
      ctx.reply(`I'm doing great, thank you! How can I assist you?`);
    } else if (text.includes("what is your name")) {
      ctx.reply(`My name is taniapricebot Bot! How can I help you today?`);
    } else if (text.includes("thank you")) {
      ctx.reply(`You're welcome! `);
    } else if (text.includes("bye")) {
      ctx.reply(`Goodbye! Have a great day!`);
    } else if (text.includes("how do i get started with trading?")) {
      ctx.reply(`To get started with trading, you should first learn about trading theory and develop a solid understanding of the markets. 
      Then, you can open an account with a broker or exchange, fund your account, and start placing trades. It is important to start with a small amount of capital and to use risk management strategies to limit potential losses.`);
    } else if (text.includes("what is technical analysis")) {
      ctx.reply(`Technical analysis is the study of market data, such as price charts and trading volumes, to identify patterns and make trading decisions. 
      Technical analysts believe that historical price movements can provide insights into future price movements, and use a variety of tools and indicators to help identify trends and market signals.`);
    } else if (text.includes("what is fundamental analysis")) {
      ctx.reply(`Fundamental analysis is the study of the underlying factors that can influence the value of a security, such as economic data, company financial statements, and industry trends. 
      Fundamental analysts use this information to evaluate the intrinsic value of a security and make trading decisions based on its perceived value relative to its market price.`);
    } else if (text.includes("calculate")) {
      // Extract the mathematical expression from the text
      const expression = text.replace(/calculate/i, "").trim();

      try {
        // Evaluate the math expression
        const result = eval(expression);

        // Send the result back to the user
        ctx.reply(`The result is: ${result}`);
      } catch (error) {
        // If an error occurs, send an error message back to the user
        ctx.reply("Invalid math expression. Please try again.");
      }
    } else {
      const emojis = text.match(emojiRegex());

      if (emojis) {
        emojis.forEach(async (emoji) => {
          try {
            switch (emoji) {
              case "😀":
                ctx.reply("❤");
                break;
              case "👍":
                ctx.reply("😊");
                break;
              case "❤️":
                ctx.reply("💕");
                break;
              case "😂":
                ctx.reply("😄");
                break;
              case "🥰":
                ctx.reply("😍");
                break;
              case "😢":
                ctx.reply("😭");
                break;
              case "😎":
                ctx.reply("😎");
                break;
              case "🤔":
                ctx.reply("🤨");
                break;
              default:
                ctx.reply("✔");
                break;
            }
          } catch (error) {
            console.error(error);

            ctx.reply("An error occurred while processing, Please try again.");
          }
        });
      }
    }

    if (text.startsWith("/")) {
      const [command, ...args] = text.split(" ");

      if (command === "/start") {
        ctx.reply(`Hello ${from.first_name}!`);
      }

      if (command === "/help") {
        const helpMessage = `
          Hello! I am taniapricebot Bot. Here are some commands you can use:
      
          /start - Start a conversation with the bot
          /price <symbol> - Get the current price of a cryptocurrency in USD (e.g. /price bitcoin)
          /chart <symbol> - Get a chart of the historical price of a cryptocurrency (e.g. /chart ethereum)
          /terms - Get definitions of common trading terms
          /theory - Get a brief overview of trading theory
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

      if (command === "/treasury") {
        const coinId = args[0]; // Extract the coinId from the command
        if (!coinId) {
          ctx.reply(
            "Please provide a valid coinId. Example: /treasury bitcoin"
          );
          return;
        }

        const publicTreasuryInfo = await fetchPublicTreasuryInfo(coinId);
        if (publicTreasuryInfo) {
          const message = `
            Cryptocurrency: ${publicTreasuryInfo.name} (${publicTreasuryInfo.symbol})
            Public Treasury USD Value: $${publicTreasuryInfo.publicTreasuryUsdValue}
            Public Treasury BTC Value: ${publicTreasuryInfo.publicTreasuryBtcValue} BTC
          `;
          ctx.replyWithHTML(`Public Treasury Information:\n\n${message}`);
        } else {
          ctx.reply(
            `Failed to fetch public treasury information for ${coinId}. Please check the coinId and try again.`
          );
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
    }
  } catch (error) {
    console.log(error);
  }
});

bot.launch();

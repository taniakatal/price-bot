const emojiRegex = require("emoji-regex");
module.exports = {
  handleIfStatements: function (ctx, text) {
    if (
      text.includes("how are you") ||
      text.includes("how are you doing") ||
      text.includes("how is it going") ||
      text.includes("how are you today") ||
      text.includes("how have you been") ||
      text.includes("how's your day") ||
      text.includes("how are things")
    ) {
      ctx.reply(`I'm doing great, thank you! How can I assist you?`);
    } else if (
      text.includes("what is your name") ||
      text.includes("your name") ||
      text.includes("who are you") ||
      text.includes("who is this") ||
      text.includes("what should I call you")
    ) {
      ctx.reply(`My name is taniapricebot Bot! How can I help you today?`);
    } else if (
      text.includes("thank you") ||
      text.includes("thanks") ||
      text.includes("appreciate it") ||
      text.includes("grateful") ||
      text.includes("thankful") ||
      text.includes("many thanks") ||
      text.includes("thx")
    ) {
      ctx.reply(`You're welcome!`);
    } else if (
      text.includes("bye") ||
      text.includes("goodbye") ||
      text.includes("farewell") ||
      text.includes("see you") ||
      text.includes("take care") ||
      text.includes("have a nice day") ||
      text.includes("until next time")
    ) {
      ctx.reply(`Goodbye! Have a great day!`);
    } else if (
      text.includes("how do I get started with trading?") ||
      text.includes("how can I start trading?") ||
      text.includes("what are the steps to start trading?") ||
      text.includes("where do I begin with trading?") ||
      text.includes("how to start trading?") ||
      text.includes("what do I need to start trading?")
    ) {
      ctx.reply(`To get started with trading, you should first learn about trading theory and develop a solid understanding of the markets. 
        Then, you can open an account with a broker or exchange, fund your account, and start placing trades. It is important to start with
         a small amount of capital and to use risk management strategies to limit potential losses.`);
    } else if (
      text.includes("what is technical analysis") ||
      text.includes("explain technical analysis") ||
      text.includes("tell me about technical analysis") ||
      text.includes("what does technical analysis mean") ||
      text.includes("how does technical analysis work")
    ) {
      ctx.reply(`Technical analysis is the study of market data, such as price charts and trading volumes, to identify patterns and make 
      trading decisions. 
    Technical analysts believe that historical price movements can provide insights into future price movements, and use a variety 
    of tools and indicators to help identify trends and market signals.`);
    } else if (
      text.includes("what is fundamental analysis") ||
      text.includes("explain fundamental analysis") ||
      text.includes("tell me about fundamental analysis") ||
      text.includes("what does fundamental analysis mean") ||
      text.includes("how does fundamental analysis work")
    ) {
      ctx.reply(`Fundamental analysis is the study of the underlying factors that can influence the value of a security, such as economic
       data, company financial statements, and industry trends.  Fundamental analysts use this information to evaluate the intrinsic value 
       of a security and make trading decisions based on its perceived value relative to its market price.`);
    } else if (
      text.includes("how does blockchain work") ||
      text.includes("explain blockchain to me") ||
      text.includes("what is the concept of blockchain") ||
      text.includes("can you give me an overview of blockchain") ||
      text.includes("how is blockchain technology used")
    ) {
      ctx.reply(
        "Blockchain is a distributed ledger technology that allows multiple participants to have a synchronized and decentralized copy of the data. In the context of cryptocurrencies, blockchain is used to record and verify transactions. It uses cryptographic techniques to ensure security and immutability of the data."
      );
    } else if (
      text.includes("what is a smart contract") ||
      text.includes("explain smart contracts")
    ) {
      ctx.reply(
        "A smart contract is a self-executing contract with the terms of the agreement directly written into code. It automatically executes actions based on predefined conditions and eliminates the need for intermediaries. Smart contracts are commonly associated with blockchain platforms like Ethereum and are used to create decentralized applications (DApps)."
      );
    } // Respond to user input
    else if (
      text.includes("how can I buy cryptocurrencies") ||
      text.includes("where to buy cryptocurrencies") ||
      text.includes("how to purchase cryptocurrencies") ||
      text.includes("can you help me with buying cryptocurrencies") ||
      text.includes("what are the steps to buy cryptocurrencies")
    ) {
      ctx.reply(
        "To buy cryptocurrencies, you can follow these steps:\n1. Choose a cryptocurrency exchange.\n2. Create an account on the exchange.\n3. Complete the verification process if required.\n4. Deposit funds into your account.\n5. Select the cryptocurrency you want to buy.\n6. Enter the amount you want to purchase.\n7. Review and confirm the transaction.\n8. Store your cryptocurrencies securely in a wallet.\nPlease note that the exact steps may vary depending on the exchange and your location."
      );
    }
    // Respond to user input
    else if (
      text.includes("what is a cryptocurrency wallet") ||
      text.includes("tell me about cryptocurrency wallets") ||
      text.includes("explain the concept of cryptocurrency wallets") ||
      text.includes("how do cryptocurrency wallets work") ||
      text.includes("can you provide information about cryptocurrency wallets")
    ) {
      ctx.reply(
        "A cryptocurrency wallet is a digital wallet that allows you to securely store, send, and receive cryptocurrencies. It consists of a pair of cryptographic keys: a public key and a private key. The public key is used to receive funds, while the private key is used to access and manage your funds. Wallets can be software-based "
      );
    } else if (
      text.includes("What is the mining process in cryptocurrencies?") ||
      text.includes("Explain how mining works in cryptocurrencies") ||
      text.includes(
        "Can you provide information about cryptocurrency mining?"
      ) ||
      text.includes(
        "Tell me about the process of mining in cryptocurrencies"
      ) ||
      text.includes("How do miners validate transactions in cryptocurrencies?")
    ) {
      ctx.reply(
        "Mining is the process of validating and adding new transactions to a blockchain. Miners use powerful computers to solve complex mathematical problems, which helps secure the network and enables them to earn rewards in the form of newly minted cryptocurrencies. This process requires significant computational power and energy consumption. Popular cryptocurrencies like Bitcoin and Ethereum use different mining algorithms, such as proof-of-work (PoW) or proof-of-stake (PoS)."
      );
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
        ctx.reply(
          "To perform calculations, simply send a message with the expression you want to evaluate. You can use operators like +, -, *, /, and parentheses for grouping calculations. Feel free to use mathematical functions like Math.sqrt(), Math.sin(), Math.cos(), Math.pow(,), etc.,"
        );
      }
    } else {
      const emojis = text.match(emojiRegex());

      if (emojis) {
        emojis.forEach(async (emoji) => {
          try {
            switch (emoji) {
              case "😀":
                ctx.reply("❤️");
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
              case "🙌":
                ctx.reply("🎉");
                break;
              case "🔥":
                ctx.reply("🌟");
                break;
              case "😊":
                ctx.reply("😃");
                break;
              case "🤗":
                ctx.reply("🤩");
                break;
              case "👏":
                ctx.reply("👌");
                break;
              case "😱":
                ctx.reply("😲");
                break;
              case "😴":
                ctx.reply("💤");
                break;
              case "😘":
                ctx.reply("😚");
                break;
              case "🤣":
                ctx.reply("😆");
                break;
              case "😇":
                ctx.reply("🥰");
                break;
              case "🙏":
                ctx.reply("🌺");
                break;
              case "👋":
                ctx.reply("👋");
                break;
              // Add more cases here for additional emojis
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
  },
};

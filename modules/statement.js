
const emojiRegex = require("emoji-regex");
module.exports = {
    handleIfStatements: function(ctx, text) {
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
        Then, you can open an account with a broker or exchange, fund your account, and start placing trades. It is important to start with a small amount of capital and to use risk management strategies to limit potential losses.`);
      } else if (
        text.includes("what is technical analysis") ||
        text.includes("explain technical analysis") ||
        text.includes("tell me about technical analysis") ||
        text.includes("what does technical analysis mean") ||
        text.includes("how does technical analysis work")
      ) {
        ctx.reply(`Technical analysis is the study of market data, such as price charts and trading volumes, to identify patterns and make trading decisions. 
        Technical analysts believe that historical price movements can provide insights into future price movements, and use a variety of tools and indicators to help identify trends and market signals.`);
      } else if (
        text.includes("what is fundamental analysis") ||
        text.includes("explain fundamental analysis") ||
        text.includes("tell me about fundamental analysis") ||
        text.includes("what does fundamental analysis mean") ||
        text.includes("how does fundamental analysis work")
      ) {
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
    }
  };
  

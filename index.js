require('dotenv').config();

const { getCryptoPriceInUSD, generateCryptoChart } = require('./modules/price');

const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);

bot.on('message', async (ctx) => {
	try {
		const { message_id, from, chat, date, text } = ctx.message;

		console.log('@' + (from.username || 'X') + ' - ' + chat.id + ' - ' + text);

		if (text.startsWith('/')) {
			const [command, ...args] = text.split(' ');

			if (command === '/start') {
				ctx.reply(`Hello ${from.first_name}!`);
			}

			if (command === '/price') {
				const cryptoSymbol = args[0].toLowerCase();
				const price = await getCryptoPriceInUSD(cryptoSymbol);

				ctx.reply(`1 ${cryptoSymbol.toUpperCase()} = USD: $${price}`);
			}

			if (command === '/chart') {
				const cryptoSymbol = args[0].toLowerCase();
				const imageBuffer = await generateCryptoChart(cryptoSymbol);

				ctx.replyWithPhoto({ source: imageBuffer });
			}
		}
	} catch (error) {
		console.log(error);
	}
});

bot.launch();

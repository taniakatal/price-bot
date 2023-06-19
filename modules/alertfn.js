const { getPrice, calculateSMA } = require("./price");
const { Alert, Crossover } = require("./Schemas");
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);

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

function checkCrossover() {
  const fastSMA = 7; // Fast moving average period (7 days)
  const slowSMA = 21; // Slow moving average period (21 days)

  Crossover.find({}, (err, crossovers) => {
    if (err) {
      console.error("Error retrieving crossovers:", err);
      return;
    }

    crossovers.forEach((crossover) => {
      const { cryptocurrency, type, chatId } = crossover;

      axios
        .get(
          `https://api.coingecko.com/api/v3/coins/${cryptocurrency}/market_chart?vs_currency=usd&days=${slowSMA}`
        )
        .then((response) => {
          const prices = response.data?.prices;

          if (!prices || prices.length < slowSMA) {
            console.log(`Insufficient price data for ${cryptocurrency}`);
            return;
          }

          const closePrices = prices.map((item) => item[1]); // Assuming the price is at index 1

          const fastSMAValues = calculateSMA(closePrices, fastSMA);
          const slowSMAValues = calculateSMA(closePrices, slowSMA);

          const lastFastSMA = fastSMAValues[fastSMAValues.length - 1];
          const lastSlowSMA = slowSMAValues[slowSMAValues.length - 1];
          const prevFastSMA = fastSMAValues[fastSMAValues.length - 2];
          const prevSlowSMA = slowSMAValues[slowSMAValues.length - 2];

          // Perform crossover check based on the type (above or below)
          if (
            (type === "above" && lastFastSMA >= lastSlowSMA && prevFastSMA < prevSlowSMA) ||
            (type === "below" && lastFastSMA <= lastSlowSMA && prevFastSMA > prevSlowSMA)
          ) {
            bot.telegram.sendMessage(
              chatId,
              `📈 ${cryptocurrency.toUpperCase()} has crossed ${type} the moving average.`
            );
          }
        })
        .catch((error) => {
          console.error("Error retrieving price data:", error);
        });
    });
  });
}

module.exports = { checkAlerts, checkCrossover };

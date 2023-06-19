const axios = require("axios");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const canvas = new ChartJSNodeCanvas({ width: 1000, height: 1000 });

async function fetchTopLosersAndGainers() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h"
    );
    const data = response.data;

    console.log(data);

    const topGainers = data
      .filter((coin) => coin.price_change_percentage_24h > 0)
      .sort(
        (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
      );

    const topLosers = data
      .filter((coin) => coin.price_change_percentage_24h < 0)
      .sort(
        (a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h
      );

    return {
      topGainers,
      topLosers,
    };
  } catch (error) {
    console.error("Failed to fetch top losers and gainers:", error);
    return null;
  }
}

function calculateSMA(data, period) {
  const closePrices = data.map((item) => item[4]); // Assuming the closing price is at index 4

  if (closePrices.length < period) {
    throw new Error(
      "Insufficient data to calculate the Simple Moving Average."
    );
  }

  const sma = [];

  for (let i = period - 1; i < closePrices.length; i++) {
    const sum = closePrices
      .slice(i - period + 1, i + 1)
      .reduce((a, b) => a + b, 0);
    const average = sum / period;
    sma.push(average);
  }

  return sma;
}



async function getExchangeRate(baseCurrency, targetCurrency) {
  try {
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );
    const rates = response.data.rates;

    if (targetCurrency in rates) {
      return rates[targetCurrency];
    } else {
      throw new Error("Invalid currency pair.");
    }
  } catch (error) {
    throw new Error("An error occurred while fetching the exchange rate.");
  }
}

function getPrice(cryptoSymbol) {
  return axios
    .get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoSymbol}&vs_currencies=usd`
    )
    .then((response) => {
      const price = response.data[cryptoSymbol]?.usd;

      return price;
    })
    .catch((error) => {
      console.log(`Error fetching price data: ${error}`);
    });
}

async function generateCryptoChart(cryptoSymbol) {
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/coins/${cryptoSymbol}/market_chart?vs_currency=usd&days=7`
  );
  const prices = response.data.prices;

  const dates = prices.map((price) => new Date(price[0]));
  const pricesInUSD = prices.map((price) => price[1]);

  const chartData = {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: `TANIABOT - ${cryptoSymbol.toUpperCase()} Price (USD)`,
          data: pricesInUSD,
          borderColor: "blue",
          fill: false,
        },
      ],
    },
  };

  const imageBuffer = await canvas.renderToBuffer(chartData);

  return imageBuffer;
}

function getCryptocurrencyInfo(coinId) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}`
      );
      resolve(response.data);
    } catch (error) {
      console.error(error);
      reject(
        new Error(
          "Failed to fetch cryptocurrency data. Please check the coin ID and try again."
        )
      );
    }
  });
}

function getTrendingcrypto() {
  return axios
    .get(`https://api.coingecko.com/api/v3/search/trending`)
    .then((response) => {
      const trending = response.data.coins;

      return trending;
    })
    .catch((error) => {
      console.log(`Error fetching price data: ${error}`);
    });
}

async function fetchPublicTreasuryInfo(coinId) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/companies/public_treasury/${coinId}`
    );
    const publicTreasuryInfo = response.data;
    return publicTreasuryInfo;
  } catch (error) {
    console.error(
      `Failed to fetch public treasury information for ${coinId}:`,
      errors
    );
    return null;
  }
}

module.exports = {
  fetchTopLosersAndGainers,
  calculateSMA,
  getExchangeRate,
  getPrice,
  generateCryptoChart,
  getCryptocurrencyInfo,
  getTrendingcrypto,
  fetchPublicTreasuryInfo,
};

const axios = require('axios');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const canvas = new ChartJSNodeCanvas({ width: 1000, height: 1000 });

function getCryptoPriceInUSD(cryptoSymbol) {
	return axios
		.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoSymbol}&vs_currencies=usd`)
		.then((response) => {
			const price = response.data[cryptoSymbol].usd;

			return price;
		})
		.catch((error) => {
			console.log(`Error fetching price data: ${error}`);
		});
}

async function generateCryptoChart(cryptoSymbol) {
	const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${cryptoSymbol}/market_chart?vs_currency=usd&days=7`);
	const prices = response.data.prices;

	const dates = prices.map((price) => new Date(price[0]));
	const pricesInUSD = prices.map((price) => price[1]);

	const chartData = {
		type: 'line',
		data: {
			labels: dates,
			datasets: [
				{
					label: `TANIABOT - ${cryptoSymbol.toUpperCase()} Price (USD)`,
					data: pricesInUSD,
					borderColor: 'blue',
					fill: false,
				},
			],
		},
	};

	const imageBuffer = await canvas.renderToBuffer(chartData);

	return imageBuffer;
}

exports.generateCryptoChart = generateCryptoChart;

exports.getCryptoPriceInUSD = getCryptoPriceInUSD;

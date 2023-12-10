import {
	APScraper,
	CNNScraper,
	FoxScraper,
	WashExamScraper,
} from '@soralinks/news-scrapers';

const apScraper = new APScraper();
const cnnScraper = new CNNScraper();
const foxScraper = new FoxScraper();
const washExamScraper = new WashExamScraper();
const scrapers = [
	apScraper,
	cnnScraper,
	foxScraper,
	washExamScraper,
];

import express from 'express';
const app = express();
const port = 4200;

app.set('view engine', 'ejs');

app.get("/", async (req, res) => {
	let search;
	if (!req.query.search) {
		search = "";
	} else {
		search = req.query["search"].toLowerCase();
	}
	const obj = {
		"headlines": [],
		"val": search
	}
	const news = await getNews();
	for (let i = 0; i < news.length; i++) {
		news[i]['headlines'].forEach(element => {
			if (element["title"].toLowerCase().includes(search) || news[i]["source"].toLowerCase().includes(search)) {
				obj["headlines"].push(element);
				if (obj["headlines"].at(-1)["title"].length > 75) {
					obj["headlines"].at(-1)["title"] = obj["headlines"].at(-1)["title"].slice(0, 71).concat("...");
				}
			}
		});
	}

	for (var i = obj["headlines"].length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = obj["headlines"][i];
		obj["headlines"][i] = obj["headlines"][j];
		obj["headlines"][j] = temp;
	}

	res.render("index", obj);
})

app.listen(port, () => {
	console.log(`API listening on port ${port}`);
});

let lastGet = 0;
let cached;

// function is to cache for 10 minutes to make faster
async function getNews() {
	if (Date.now() - lastGet < (10 * 60 * 1000)) {
		return cached;
	}
	cached = rawGet();
	lastGet = Date.now();
	return cached;
}

async function rawGet() {
	const results = await Promise.allSettled(
		scrapers.map(async (scraper) => {
			return scraper.scrape();
		})
	);

	const responses = results.map(result => {
		if (result.status === 'fulfilled') {
			return result.value;
		}
		return undefined;
	}).filter(Boolean);

	return responses;
}

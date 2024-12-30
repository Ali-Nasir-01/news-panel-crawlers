import * as cheerio from "cheerio";
import axios from "axios";
import "dotenv/config";

const baseUrl = "https://www.tabnak.ir";
const $ = await cheerio.fromURL(baseUrl);

const newsItems = $(".parentsSPN");

const results = [];

const promises = newsItems.map(async (index, item) => {
  const images = [];
  const $item = cheerio.load(item);
  images.push($item("a.picLink > img").attr("src"));
  const link = `${baseUrl}${$item("a.picLink").attr("href")}`;
  const $singlePage = await cheerio.fromURL(link);
  const title = $singlePage(".top_news_title > div.title > h1.Htag").text(); // title
  const subtitle = $singlePage(".top_news_title > div.subtitle").text(); // subtitle
  const category = $singlePage("div.news_path > a.newsbody_servicename").text(); // category
  const publishDate = $singlePage("div.news_nav > span.en_date") // publish date
    .text()
    .trim()
    .split("\t")[0]
    .trim();
  const bodyItems = $singlePage("div#newsMainBody > p");
  const bodyText = []; // Text
  bodyItems.each((index, bodyItem) => {
    const $bodyItem = cheerio.load(bodyItem);
    bodyText.push($bodyItem.text());
  });
  results.push({
    link,
    title,
    subtitle,
    images,
    publishDate,
    category,
    text: bodyText.join("\n"),
  });
});

Promise.all(promises)
  .then(async () => {
    const response = await axios.post(
      `${process.env.BASE_URL}${process.env.TABNAK_API}`,
      {
        news: results,
      }
    );

    console.log(response.data);
  })
  .catch((error) => {
    console.error("Error processing news items:", error);
  });

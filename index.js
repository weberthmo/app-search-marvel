const { Client } = require("@elastic/elasticsearch");
const crypto = require("crypto");
const axios = require("axios");
const client = new Client({
  node: "https://app-marvel.es.us-central1.gcp.cloud.es.io:9243",
  auth: {
    username: "elastic",
    password: "",
  },
});
const publicKey = "";
const privateKey = "";
const indexName = "marvel";
const timestamp = Date.now();
let offset = 0;
let characters = [];
const bulkInsertParams = [];
let total = 0;
const hash = crypto.createHash("md5");
const stringToHash = timestamp + privateKey + publicKey;
hash.update(stringToHash);
const hashResult = hash.digest("hex");

async function appMarvelSearch() {
  try {
    // while (offset < 2) {
    while (offset < total || total === 0) {
      const apiUrl = `https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${publicKey}&hash=${hashResult}&offset=${offset}&limit=100`;
      console.log(apiUrl);
      const response = await axios.get(apiUrl);
      total = response.data.data.total;
      offset += response.data.data.count;
      characters = characters.concat(response.data.data.results);
      //   //   characters.push(response.data.data.results);
      //   console.log("characters.length");
      //   console.log(response.data.data.results);
    }
  } catch (error) {
    console.error("erro de indexação", error);
  }


  characters.forEach(async (element) => {
    console.log(bulkInsertParams.length);
    bulkInsertParams.push({
      index: {
        _index: indexName,
        _id: element.id,
      },
      id: element.id,
      name: element.name,
      description: element.description,
      thumbnail: element.thumbnail,
      thumbnail: `${element.thumbnail.path}.${element.thumbnail.extension}`,
    });
  });

  try {
    await client.bulk({
      body: bulkInsertParams,
      refresh: true,
    });
  } catch (error) {
    console.log(error);
  }

  console.log("Indexação finalizad");
}

appMarvelSearch();

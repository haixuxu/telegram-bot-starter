// https://medium.com/%E7%A8%8B%E5%BC%8F%E8%A3%A1%E6%9C%89%E8%9F%B2/telegram-bot-%E7%AC%AC%E4%B8%80%E6%AC%A1%E9%96%8B%E7%99%BC%E5%B0%B1%E4%B8%8A%E6%89%8B-f8e93a05f26c
// https://core.telegram.org/bots/api#making-requests

const express = require("express");
const axios = require("axios");
var bodyParser = require("body-parser");
const app = express();
const port = 3000;

const SocksProxyAgent = require("socks-proxy-agent").SocksProxyAgent;
// the full socks5 address
// create the socksAgent for axios
const httpsAgent = new SocksProxyAgent(`socks5h://127.0.0.1:1080`, {
  dns: true,
});

const token =
  process.env.BOT_TOKEN;

const axiosinc = axios.create({
  baseURL: `https://api.telegram.org/bot${token}`,
  httpsAgent,
});

// receive

// {
//     "updateId": "999990000",
//     "Message": {
//       "messageId": "999",
//       "date": "1579875125",
//       "text": "hi",
//       "from": {
//         "id": "913456635",
//         "isBot": false,
//         "firstName": "firstName",
//         "lastName": "lastName",
//         "userName": "userName",
//         "languageCode": "zh@collation=stroke"
//       },
//       "chat": {
//         "id": "913456635",
//         "firstName": "firstName",
//         "lastName": "lastName",
//         "userName": "userName",
//         "type": "private"
//       }
//     }
//   }
// send to bot https://api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage

// https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url={YOUR_WEBHOOK_URL}
// https://api.telegram.org/bot{YOUR_BOT_TOKEN}/deleteWebhook
function sendMessage(data) {
  return axiosinc.post(`/sendMessage`, data).catch((err) => {
    throw Error(err.message);
  });
}

function setHook(hookUrl) {
  return axiosinc.get(`/setWebhook?url=${hookUrl}`).catch((err) => {
    throw Error(err.message);
  });
}

function getHook() {
  return axiosinc.get(`/getWebhookInfo`).catch((err) => {
    console.log(err);
    throw Error(err.message);
  });
}

function delHook() {
  return axiosinc.get(`/deleteWebhook`).catch((err) => {
    throw Error(err.message);
  });
}

setHook("https://bottest.gank.75cos.com/receive").then((resp) => {
  console.log("resp==", resp.data);
  getHook().then((res) => {
    console.log(res.data);
  });
});

function handleMessage(msg) {
  const chatId = msg.chat.id;
  sendMessage({ chat_id: chatId, text: "welcome to here >>"+msg.from.first_name+' '+msg.from.last_name });
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.post("/receive", async (req, res) => {
  console.log("body===", req.body);
  // handle message
  handleMessage(req.body.message);

  res.status(200).send("OK");
  // res.send("Hello World!");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage
app.listen(port, () => {
  console.log(`Example app listening on port http://127.0.0.1:${port}/`);
});

// https://medium.com/%E7%A8%8B%E5%BC%8F%E8%A3%A1%E6%9C%89%E8%9F%B2/telegram-bot-%E7%AC%AC%E4%B8%80%E6%AC%A1%E9%96%8B%E7%99%BC%E5%B0%B1%E4%B8%8A%E6%89%8B-f8e93a05f26c
// https://core.telegram.org/bots/api#making-requests
require('./lib/config');
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const chatgpt = require("./lib/chatgpt");
const loggerFn = require('./lib/logger');

const app = express();
const port = process.env.PORT||3000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_HOST = process.env.BOT_HOST;
const NODE_ENV = process.env.NODE_ENV;
const LOG_LEVEL = process.env.LOG_LEVEL;
const axiosOpts = { baseURL: `https://api.telegram.org/bot${BOT_TOKEN}` };

require('fs').writeFileSync('temp.json',JSON.stringify(process.env));

const logger = loggerFn("Bot>", LOG_LEVEL || "info");
// for develop
if (NODE_ENV !== "production") {
  const SocksProxyAgent = require("socks-proxy-agent").SocksProxyAgent;
  // the full socks5 address
  // create the socksAgent for axios
  axiosOpts.httpsAgent = new SocksProxyAgent(`socks5h://127.0.0.1:1080`);
}

const axiosinc = axios.create(axiosOpts);

// receive
// send to bot https://api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage
// https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url={YOUR_WEBHOOK_URL}
// https://api.telegram.org/bot{YOUR_BOT_TOKEN}/deleteWebhook
function sendTextMessage(chatId, text) {
  // logger.info('====data===',data);
  const msg = { chat_id: chatId, text };
  return axiosinc.post(`/sendMessage`, msg).catch((err) => {
    logger.info("sendTextMessage:" + err.message);
    // throw Error(err.message);
    return axiosinc
      .post(`/sendMessage`, { chat_id: chatId, text: err.message })
      .catch((err) => null);
  });
}

function setHook(hookUrl) {
  // logger.info('setHook===',hookUrl);
  return axiosinc.get(`/setWebhook?url=${hookUrl}`).catch((err) => {
    throw Error(err.message);
  });
}

function getHook() {
  return axiosinc.get(`/getWebhookInfo`).catch((err) => {
    logger.info(err);
    throw Error(err.message);
  });
}
logger.info(`hookurl:https://${BOT_HOST}/receive`);
setHook(`https://${BOT_HOST}/receive`).then((resp) => {
  logger.info("resp==" + JSON.stringify(resp.data));
  getHook().then((res) => {
    logger.info(res.data);
  }).catch(err=>{
    logger.error(err.message);
  })
}).catch(err=>{
  logger.error(err.message);
})

const chatUsers = {};

function handleCommand(command, msg) {
  const chatId = msg.chat.id;
  if (command === "/start") {
    const userId = msg.from.id;
    chatUsers[userId] = msg.from;
    sendTextMessage(
      chatId,
      `session created >> you can start chat now, to stop with /stop`
    );
  } else if (command === "/stop") {
    delete chatUsers[userId];
    chatgpt.stopChat(userId);
    sendTextMessage(
      chatId,
      `session destoryed >> stop chat success!, to start with /start`
    );
  } else if (command === "/help") {
    sendTextMessage(chatId, "welcome to here >> command /start /stop /help");
  }
}

async function handleMessage(msg) {
  logger.info("handle message:"+JSON.stringify(msg));
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (msg.text[0] === "/") {
    // controller
    handleCommand(msg.text, msg);
  } else if (chatUsers[userId]) {
    const events = await chatgpt.startChat(userId, msg.text);
    let msg2 = "";
    for await (const event of events) {
      for (const choice of event.choices) {
        const delta = choice.delta&&choice.delta.content;
        if (delta !== undefined) {
          msg2 += delta;
        }
      }
    }
    sendTextMessage(chatId, msg2);
  } else {
    sendTextMessage(
      chatId,
      "welcome!" +
        msg.from.first_name +
        " " +
        msg.from.last_name +
        " start with /help"
    );
  }
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.post("/receive", async (req, res) => {
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
  logger.info(`Example app listening on port http://127.0.0.1:${port}/`);
});

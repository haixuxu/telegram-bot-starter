const envname = process.env.NODE_ENV;
require("dotenv").config({
  path: envname === "production" ? ".env.production" : ".env",
});

console.log(process.env.BOT_TOKEN);

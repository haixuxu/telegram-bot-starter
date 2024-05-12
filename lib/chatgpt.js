const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const readline = require("readline");
require("dotenv").config();
const getTokenCount = require("./tiktoken").getTokenCount;
const endpoint = process.env.AZURE_GPT_ENDPOINT;
const key = process.env.AZURE_GPT_KEY;
const deploymentId = process.env.AZURE_GPT_DEPLOYMENT_NAME;
const MAX_TOKEN = 4096;

const client = new OpenAIClient(endpoint, new AzureKeyCredential(key));

const users = {};

const msgcontext = [{ role: "system", content: "你现在是上帝，无所不能." }];

function updateMessages(userId, max_tokens) {
  const msgcontext = users[userId];
  while (msgcontext.length > 3) {
    let msgstr = msgcontext.reduce((sumstr, message) => {
      return (sumstr += `${message.role}:${message.content}`);
    }, "");
    if (getTokenCount(msgstr) > max_tokens) {
      msgcontext.splice(1, 2);
    } else {
      break;
    }
  }
}

async function chatResponse(userId, newmessage) {
  try {
    if (!users[userId]) {
      users[userId] = msgcontext.slice();
    }
    users[userId].push({ role: "user", content: newmessage });
    updateMessages(userId, MAX_TOKEN);
    const messages = users[userId];

    //   console.log(messages);
    const events = await client.streamChatCompletions(deploymentId, messages, {
      maxTokens: 1024, // response max token
    });
    return events;
  } catch (error) {
    console.log(111, error);
  }
  //   for await (const event of events) {
  //     for (const choice of event.choices) {
  //       const delta = choice.delta?.content;
  //       if (delta !== undefined) {
  //         console.log(`Chatbot: ${delta}`);
  //       }
  //     }
  //   }
}

exports.startChat = chatResponse;
exports.stopChat = function (userId) {
  delete users[userId];
};

if (require.main === module) {
  replDemo();
  function replDemo() {
    let rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt("prompt> ");
    rl.prompt();
    rl.on("line", async function (line) {
      if (line === "exit" || line === "quit" || line == "q") {
        rl.close();
        return; // bail here, so rl.prompt() isn't called again
      }
      if (line === "help" || line === "?") {
        console.log(`commands:\n  woof\n  exit|quit\n`);
      } else {
        process.stdout.write("chatgtp>");
        const events = await chatResponse("zhangsan", line);
        for await (const event of events) {
          for (const choice of event.choices) {
            const delta = choice.delta?.content;
            if (delta !== undefined) {
              process.stdout.write(delta);
            }
          }
        }
        process.stdout.write("\n");
      }
      rl.prompt();
    }).on("close", function () {
      console.log("bye");
    });
  }
}

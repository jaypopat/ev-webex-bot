require("dotenv").config();
var framework = require("webex-node-bot-framework");
var webhook = require("webex-node-bot-framework/webhook");
var express = require("express");
var bodyParser = require("body-parser");
var axios = require("axios");
var app = express();
app.use(bodyParser.json());
app.use(express.static("images"));
const config = {
  webhookUrl: process.env.WEBHOOKURL,
  token: process.env.BOTTOKEN,
  port: process.env.PORT,
};

const api = process.env.API_URL;

var framework = new framework(config);
framework.start();
console.log("Starting framework, please wait...");

framework.on("initialized", () => {
  console.log("Framework is all fired up! [Press CTRL-C to quit]");
});


framework.on("log", (msg) => {
  console.log(msg);
});

framework.hears("roomid", (bot, trigger) => {
  console.log(bot.room.id);
});

function pollBotMessages() {
  axios.get(`${api}/bot-messages`)
    .then((response) => {
      const messages = response.data;
      messages.forEach((message) => {
        framework.webex.messages.create({
          // hardcoded roomId for the bot
          roomId: 'Y2lzY29zcGFyazovL3VybjpURUFNOnVzLXdlc3QtMl9yL1JPT00vYThiYWNjZTAtMzczYS0xMWVmLTk1MjUtM2IwZGUzNzEyMmNk',
          text: message
        });

      });
    })
    .catch((error) => {
      console.error("Failed to get bot messages:", error);
    });
}

// Poll for bot messages every second
setInterval(pollBotMessages, 1000);

framework.hears("available chargers", (bot, trigger) => {
  axios.get(`${api}/available-charging-stations`)
    .then((response) => {
      const chargers = response.data;
      let msg = "Available chargers: \n";
      chargers.forEach((charger) => {
        msg += `ID: ${charger.id}, Location: ${charger.location.address}, Type: ${charger.type}, Status: ${charger.status}\n`;
      });
      bot.say(msg);
    })
    .catch((error) => {
      console.error("Failed to get available chargers:", error);
      bot.say("Failed to get available chargers");
    });
});
framework.hears("charging stations", (bot, trigger) => {
  axios.get(`${api}/charging-stations`)
    .then((response) => {
      const chargers = response.data;
      let msg = "Charging stations: \n";
      chargers.forEach((charger) => {
        msg += `ID: ${charger.id}, Location: ${charger.location.address}, Type: ${charger.type}, Status: ${charger.status}\n`;
      });
      bot.say(msg);
    })
    .catch((error) => {
      console.error("Failed to get charging stations:", error);
      bot.say("Failed to get charging stations");
    });
});
framework.hears("charge", (bot, trigger) => {
  bot.dmCard(trigger.personId, {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.3",
    "body": [
      {
        "type": "Input.ChoiceSet",
        "id": "connectorType",
        "choices": [
          {
            "title": "CCS",
            "value": "CCS"
          },
          {
            "title": "Tesla",
            "value": "Tesla"
          },
          {
            "title": "CHAdeMO",
            "value": "CHAdeMO"
          },
          {
            "title": "Type 2",
            "value": "Type 2"
          },
          {
            "title": "Type 1",
            "value": "Type 1"
          }
        ],
        "placeholder": "Select Connector Type"
      }
    ],
    "actions": [
      {
        "type": "Action.Submit",
        "title": "Submit",
        "data": {
          "cardType": "input"
        }
      }
    ]
  });
});

framework.hears("queue for all", (bot, trigger) => {
  axios.get(`${api}/queue-for-all`)
    .then((response) => {
      const queue = response.data;

      // if queue empty
      if (queue.length === 0) {
        bot.say("Queue is empty. Call the charge function to get started!");
        return;
      }

      let msg = "Queue for all:\n";
      queue.forEach((request) => {
        msg += `Name: ${request.name}, Connector: ${request.connector}\n`;
      });
      bot.say(msg);
    })
    .catch((error) => {
      console.error("Failed to get queue for all:", error);
      bot.say("Failed to get queue for all");
    });
});


// return details for specific charging station
framework.hears("charging station details", (bot, trigger) => {
  let args = trigger.args;
  let id = args[4];
  console.log(id);
  axios.get(`${api}/charging-stations/${id}`)
    .then((response) => {
      const charger = response.data;
      let msg = `Charging station details for ${id}:\n`;
      msg += `Location: ${charger.location.address}\n`;
      msg += `Type: ${charger.type}\n`;
      msg += `Status: ${charger.status}\n`;
      msg += `Connector types: ${charger.connectorTypes.join(", ")}\n`;
      bot.say(msg);
    })
    .catch((error) => {
      console.error("Failed to get charging station details:", error);
      bot.say("Failed to get charging station details");
    });
});

framework.hears("queue for connector", (bot, trigger) => {
  const connector = trigger.args[4];
  console.log("Requesting queue for connector:", connector); 
  axios.post(`${api}/queue-for-me`, {connector: connector })
    .then((response) => {
      console.log(response);
      const queue = response.data;
      console.log("Received queue data:", queue);
      let msg = `Queue for ${connector}:\n`;
      if (queue.length === 0) {
        msg += "The queue is currently empty.";
      } else {
        queue.forEach((request) => {    
          msg += `Name: ${request.name}\n`;
        });
      }
      bot.say(msg);
    })
    .catch((error) => {
      console.error("Failed to get queue for connector:", error);
      bot.say("An error occurred while retrieving the queue information.");
    });
});

framework.on("attachmentAction", (bot, trigger) => {
  const connectorType = trigger.attachmentAction.inputs.connectorType;
  axios.post(`${api}/charge-queue`, { name: trigger.person.displayName, connector: connectorType })
    .then((response) => {
      bot.say(response.data.message);
    })
    .catch((error) => {
      console.error("Failed to add to charge queue:", error);
      bot.say("Failed to add to charge queue");
    });
});

app.get("/", (req, res) => {
  res.send(`Bot is alive.`);
});

app.post("/", webhook(framework));

const server = app.listen(config.port, () => {
  console.log(`Bot server running at http://localhost:${config.port}`);
});

process.on("SIGINT", () => {
  console.log("Stopping bot...");
  server.close();
  framework.stop().then(() => {
    console.log("Bot stopped.");
    process.exit();
  });
}); 
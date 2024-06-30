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

const api = "http://localhost:3000";

var framework = new framework(config);
framework.start();
console.log("Starting framework, please wait...");

framework.on("initialized", () => {
  console.log("Framework is all fired up! [Press CTRL-C to quit]");
});


framework.on("log", (msg) => {
  console.log(msg);
});

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
            "title": "CCS Type 1",
            "value": "CCS"
          },
          {
            "title": "CCS Type 2",
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

framework.hears("queue for connector", (bot, trigger) => {
  const connector = trigger.args[3];
  axios.get(`${api}/queue-for-me`,{
    params: {
      connector
    }
  })
    .then((response) => {
        const queue = response.data;
        let msg = `Queue for ${connector}:\n`;
        queue.forEach((request) => {
            msg += `Name: ${request.name}\n`;
        });
        bot.say(msg);
    })
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
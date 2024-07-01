require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const PORT = process.env.BACKEND_API_PORT;
const db = require("./db.json");


const waitingList = [];

app.get("/", (req, res) => {
    res.send("Hello from Express!");
});

const botMessages = [];

app.get("/bot-messages", (req, res) => {
    const messages = [...botMessages];
    botMessages.length = 0;
    res.json(messages);
});

app.post("/charge-queue", (req, res) => {
    const { name, connector } = req.body;
    waitingList.push({ name, connector });
    console.log(`Request added to queue: ${name} with connector ${connector}`);
    processQueue();
    res.status(202).json({ message: "Your request has been added to the queue." });
});

app.get("/queue-for-all", (req, res) => {
    res.json(waitingList);
});

// as a result if employees wanna switch around spots they can do so by communicating with each other this will be a feature that can be added in the future
app.post("/queue-for-me", (req, res) => {
    const connector = req.body.connector;

    const customQueue = waitingList.filter(request => {
        return request.connector === connector;
    });
    res.json(customQueue);
});


app.get("/available-charging-stations", (req, res) => {
    const availableChargers = db.filter(charger => charger.status === "Available");
    res.json(availableChargers);
});

app.get("/charging-stations", (req, res) => {
    res.json(db);
});

app.get("/charging-stations/:id", (req, res) => {
    const id = req.params.id;
    const charger = db.find(charger => charger.id === id);
    if (charger) {
        res.json(charger);
    } else {
        res.status(404).json({ message: "Charger not found." });
    }
});


let lastQueueLength = 0;

function processQueue() {
    waitingList.forEach((request, index) => {
        const charger = db.find(charger =>
            charger.status === "Available" && charger.connectorTypes.includes(request.connector)
        );
        if (charger) {
            charger.status = "Charging";
            console.log(`Assigned charger: ${charger.name} ${charger.id} to request ${request.name}`);
            botMessages.push(`Assigned charger: charger name - ${charger.name} charger id - ${charger.id} charger type ${request.connector} to request ${request.name}`);
            waitingList.splice(index, 1);

            setTimeout(() => {
                charger.status = "Available";
                botMessages.push(`Charging session ended for ${charger.name} - user being ${request.name} notified.`);
                console.log(`Charging session ended for ${charger.name} - user being ${request.name} notified.`);
                processQueue();
            }, 30000); // charging lasts for 30 seconds
        }
    });

    // Only send queue message if the queue length has changed
    if (waitingList.length !== lastQueueLength) {
        if (waitingList.length > 0) {
            const queueMessage = waitingList.map(request =>
                `${request.name} (${request.connector})`
            ).join(', ');
            botMessages.push(`Current queue: ${queueMessage}`);
        } else {
            botMessages.push("Queue is now empty.");
        }
        lastQueueLength = waitingList.length;
    }
}


// Poll the queue every 5 seconds       
setInterval(processQueue, 5000);

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}/`);
});     

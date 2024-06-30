require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const PORT = process.env.BACKEND_API_PORT;
const db = [
    {
        id: "1",
        name: "Car Park Fast Charger 1",
        location: {
            address: "ABC Car Park, 123 Main Street, Anytown",
            latitude: 51.5074,
            longitude: -0.1278
        },
        type: "DC Fast Charger",
        powerOutputKW: 150,
        status: "Available",
        connectorTypes: ["CCS", "CHAdeMO"]
    },
    {
        id: "2",
        name: "Car Park Fast Charger 2",
        location: {
            address: "ABC Car Park, 123 Main Street, Anytown",
            latitude: 51.5074,
            longitude: -0.1278
        },
        type: "DC Fast Charger",
        powerOutputKW: 350,
        status: "Available",
        connectorTypes: ["CCS", "Tesla"]
    },
    {
        id: "3",
        name: "Car Park Level 2 Charger 1",
        location: {
            address: "ABC Car Park, 123 Main Street, Anytown",
            latitude: 51.5074,
            longitude: -0.1278
        },
        type: "Level 2 AC Charger",
        powerOutputKW: 22,
        status: "Available",
        connectorTypes: ["Type 2"]
    },
    {
        id: "4",
        name: "Car Park Level 2 Charger 2",
        location: {
            address: "ABC Car Park, 123 Main Street, Anytown",
            latitude: 51.5074,
            longitude: -0.1278
        },
        type: "Level 2 AC Charger",
        powerOutputKW: 7,
        status: "Available",
        connectorTypes: ["Type 1"]
    }
];

const waitingList = [];

app.get("/", (req, res) => {        
    res.send("Hello from Express!");
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
app.get("/queue-for-me", (req, res) => {
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

    function processQueue() {
        waitingList.forEach((request, index) => {
            const charger = db.find(charger =>
                charger.status === "Available" && charger.connectorTypes.includes(request.connector)
            );

            if (charger) {
                charger.status = "Charging";
                console.log(`Assigned charger: ${charger.name} ${charger.id} to request ${request.name}`);
                waitingList.splice(index, 1);
                // Simulate charge end after 15 seconds
                setTimeout(() => {
                    charger.status = "Available";
                    console.log(`Charging session ended for ${charger.name}`);
                    processQueue();  // Check queue again after a charger becomes available
                }, 15000); // 15 seconds in milliseconds
            } else {
                console.log(`No available charger for request: ${request.name} with connector ${request.connector}`);
            }
        });
    }
// Poll the queue every 5 seconds
setInterval(processQueue, 5000);

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}/`);
});     

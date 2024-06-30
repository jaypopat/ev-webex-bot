# Webex EV Charging Bot

This project provides a Webex bot that automates and streamlines the EV charging process for users. It allows users to:

* **View available chargers:** Get a list of currently available charging stations.
* **View all chargers:** Get a list of all charging stations (including those in use).
* **Join the charging queue:** Request to charge their EV and select their connector type.
* **View queue status:** See their position in the queue (for all connectors or a specific connector).

## How it Works

1. **Express API:** The `api.js` file sets up an Express.js server that acts as the backend. It stores the charging station data, manages the charging queue, and provides endpoints for the bot to interact with.

2. **Webex Bot:** The `index.js` file uses the Webex Node Bot Framework to create the bot. The bot listens for specific commands from users in Webex and interacts with the API to fulfill their requests.

3. **Charging Queue Logic:** A queue system (`waitingList`) ensures fair access to chargers. When a user joins the queue, the bot checks for available chargers that match their connector type. If found, the charger is assigned, and a simulated charging session begins. The queue is re-evaluated periodically to assign chargers as they become available.

## Setup and Installation

1. **Prerequisites:**
   * Node.js and npm installed
   * Webex Bot Account (create at [https://developer.webex.com/](https://developer.webex.com/))
   * A `.env` file with the following environment variables:
      * `WEBHOOKURL` - Your Webex webhook URL
      * `BOTTOKEN` - Your Webex bot token
      * `PORT` - The port for the bot server (e.g., 3000)

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run the API:**
   ```bash
   node api.js
   ```

4. **Run the Bot:**
   ```bash
   node index.js
   ```
**Webex Bot Commands**
* **available chargers:** Get a list of available chargers.
* **charging stations:** Get a list of all chargers.
* **charge:** Starts process of joining the queue
* **queue for all:** See the queue for all connector types.
* **queue for connector [connector type]:** See the queue for a specific connector type (e.g., "queue for connector CCS").
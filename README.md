# Uber API Interaction and Price Monitoring Tool

This project consists of two main components:
1.  An Express.js-based API that facilitates interaction with the Uber API for various services.
2.  A command-line tool (`horadeir.js`) designed to monitor Uber ride prices for a specified route and notify when prices are favorable.

## Express API (`app.js`)

This component is an Express.js server that provides a backend for interacting with the Uber API.

**Purpose:**
To offer a set of endpoints that allow applications to easily integrate Uber functionalities.

**API Endpoints:**
*   `/api/login`: Initiates the Uber OAuth2 authentication flow.
*   `/api/callback`: Handles the OAuth2 callback from Uber to retrieve access tokens.
*   `/api/me`: Fetches the authenticated user's Uber profile information.
*   `/api/payment-methods`: Retrieves the user's saved payment methods.
*   `/api/history`: Gets the user's ride history.
*   `/api/requests/current`: Checks the status of the user's current Uber ride (uses the Uber Sandbox API).

**Key Dependencies:**
*   `express`: Web framework for Node.js.
*   `node-uber`: Node.js wrapper for the Uber API.
*   `axios`: Promise-based HTTP client for making direct API calls.

**Running the API:**
1.  Ensure Node.js and npm are installed.
2.  Install dependencies: `npm install`
3.  Configure your Uber API credentials in `app.js`.
4.  Start the server: `node app.js` (Typically runs on `http://localhost:3000`)

**Important Configuration Note:**
You **must** replace the placeholder `client_id`, `client_secret`, and `server_token` in `app.js` with your own Uber application credentials for the API to function correctly.

## Price Monitoring Tool (`horadeir.js`)

This command-line tool is designed to monitor Uber ride prices for a user-specified route and provide notifications when the fare is considered low. The name "horadeir" translates from Portuguese as "time to go."

**Purpose:**
To help users find the most cost-effective time to request an Uber by periodically checking price estimates for a specific journey.

**How to Run:**
1.  Ensure Node.js and npm are installed.
2.  Install dependencies: `npm install`
3.  Configure your Uber API credentials and Google Maps API key in `horadeir.js`.
4.  Run the script from your terminal:
    ```bash
    node horadeir.js "Your Origin Address" "Your Destination Address"
    ```
    Replace `"Your Origin Address"` and `"Your Destination Address"` with the actual start and end points of the desired trip.

**Key Dependencies:**
*   `@google/maps`: Node.js client library for Google Maps services (used here for geocoding addresses).
*   `node-uber`: Node.js wrapper for the Uber API.
*   `axios`: Promise-based HTTP client.

**Output:**
The script will periodically print messages to the console indicating the current price status:
*   `HORA BOA PARA CHAMAR UBER!` (Good time to call Uber!) - When the estimated fare is below a certain threshold (hardcoded in the script).
*   `AGUARDE, AINDA ESTÁ CARO!!!` (Wait, it's still expensive!!!) - When the estimated fare is above the threshold.
It also logs the geocoded origin and destination addresses.

**Important Configuration Note:**
You **must** replace the placeholder Uber API credentials (`client_id`, `client_secret`, `server_token`, and an existing `token` variable) and the Google Maps API key (`key` within `googleMapsClient` initialization) in `horadeir.js` with your own valid credentials for the tool to work.

## Prerequisites

Before you can run this project, you'll need the following:

*   **Node.js and npm:** Download and install from [https://nodejs.org/](https://nodejs.org/).
*   **Uber Developer Account:** You'll need to register an application on the [Uber Developer Dashboard](https://developer.uber.com/) to obtain API credentials (Client ID, Client Secret, Server Token).
*   **Google Cloud Platform Account:** A Google Cloud Platform project with the **Geocoding API** enabled is required to get a Google Maps API key. You can set this up at [https://console.cloud.google.com/](https://console.cloud.google.com/).

## Installation

1.  Clone this repository to your local machine (or download the source code).
2.  Navigate to the project directory in your terminal.
3.  Install the necessary Node.js dependencies:
    ```bash
    npm install
    ```

## Configuration

To use this project, you **must** configure it with your personal API keys and credentials. The placeholder values in the code will not work.

1.  **`app.js` (Express API):**
    *   Open the `app.js` file.
    *   Locate the `uber` variable initialization:
        ```javascript
        let uber = new Uber({
            client_id: '-', // <-- REPLACE WITH YOUR CLIENT ID
            client_secret: '', // <-- REPLACE WITH YOUR CLIENT SECRET
            server_token: '', // <-- REPLACE WITH YOUR SERVER TOKEN
            redirect_uri: 'http://localhost:3000/api/callback', // Ensure this matches your Uber app config
            name: 'Hackathon uHack',
            language: 'pt_BR'
        });
        ```
    *   Replace the placeholder values for `client_id`, `client_secret`, and `server_token` with your actual Uber application credentials.
    *   Ensure the `redirect_uri` matches the one you configured in your Uber Developer Dashboard.

2.  **`horadeir.js` (Price Monitoring Tool):**
    *   Open the `horadeir.js` file.
    *   **Google Maps API Key:**
        *   Locate the `googleMapsClient` initialization:
            ```javascript
            let googleMapsClient = maps.createClient({
                key: 'AIzaS...M', // <-- REPLACE WITH YOUR GOOGLE MAPS API KEY
            });
            ```
        *   Replace `'AIzaS...M'` with your valid Google Maps Geocoding API key.
    *   **Uber Credentials:**
        *   Locate the `uber` variable initialization:
            ```javascript
            let uber = new Uber({
                client_id: 'EwGTCbr9...', // <-- REPLACE WITH YOUR CLIENT ID
                client_secret: '3zgZx8QcoaD....', // <-- REPLACE WITH YOUR CLIENT SECRET
                server_token: 'HkqmgeWL....', // <-- REPLACE WITH YOUR SERVER TOKEN
                redirect_uri: 'http://localhost:3000/api/callback', // Ensure this matches your Uber app config
                name: 'Hackathon uHack',
                language: 'pt_BR'
            });
            ```
        *   Replace the placeholder values for `client_id`, `client_secret`, and `server_token`.
        *   **Access Token:** This script also contains a hardcoded access token variable:
            ```javascript
            let token = "JA.VUNmGAAAAAAAEgASA...."; // <-- REPLACE WITH A VALID ACCESS TOKEN OR IMPLEMENT DYNAMIC FETCH
            ```
            For the script to work immediately, you might need to replace this with a valid access token obtained through an OAuth flow (e.g., by running `app.js` first and capturing a token). Alternatively, you would need to modify the script to dynamically fetch/refresh this token.

## Usage

After installation and configuration, you can run the two components of this project as follows:

### 1. Express API (`app.js`)

To start the Express server which provides API endpoints for Uber interaction:

1.  Navigate to the project's root directory in your terminal.
2.  Run the command:
    ```bash
    node app.js
    ```
3.  By default, the server will start on `http://localhost:3000`. You should see a message "Example app listening on port 3000!" in your console.
4.  You can then access the API endpoints listed earlier (e.g., navigate to `http://localhost:3000/api/login` in your browser to start the Uber login process).

### 2. Price Monitoring Tool (`horadeir.js`)

To use the command-line tool for monitoring Uber prices for a specific route:

1.  Navigate to the project's root directory in your terminal.
2.  Run the script with your desired origin and destination as command-line arguments. Enclose addresses in quotes, especially if they contain spaces:
    ```bash
    node horadeir.js "1600 Amphitheatre Parkway, Mountain View, CA" "Golden Gate Bridge, San Francisco, CA"
    ```
    *(Replace the example addresses with your actual desired origin and destination).*
3.  The script will start geocoding the addresses and then periodically poll the Uber API for price estimates. It will print messages to the console indicating if it's a good time to book based on the current price.

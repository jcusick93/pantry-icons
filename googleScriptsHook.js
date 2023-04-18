const express = require("express");
const bodyParser = require("body-parser");
const ngrok = require("ngrok");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const PORT = 3000;
const app = express();
const passcode = crypto.randomBytes(48).toString("hex");

app.use(bodyParser.json());

app.post("/", (request, response) => {
  if (request.body.passcode === passcode) {
    const { file_name, timestamp, triggered_by, version, description, handle } =
      request.body;

    // handles the initial push from Figma of blank files that come in
    if (!file_name) {
      return null;
    } else {
      console.log(
        `📁 File name: ${file_name}\n⏰ Updated on: ${timestamp}.\n` +
          (triggered_by && triggered_by.handle
            ? `😎 Updated by: ${triggered_by.handle}.\n`
            : "") +
          `📝 Notes: ${description}\n\n===================================================\n`
      );

      // Make a request to your Google Scripts webhook endpoint to retrieve the data
      axios
        .get(
          "https://script.google.com/macros/s/AKfycbxKhk25-StpCAVOlalN8ov3EJQHt_ug0AJN7OqsGelpIG_01ghgumT9gaxLlhcSdWJn/exec"
        )
        .then((response) => {
          const data = response.data;
          console.log(data); // Log the retrieved data
          // Here you can compile the rest of your fetch.js file and perform the necessary actions
          // ...
        })
        .catch((error) => {
          console.error(error);
        });

      response.sendStatus(200);
    }
  } else {
    response.sendStatus(403);
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

ngrok.connect(PORT).then(async (endpoint) => {
  const response = await axios({
    url: "https://api.figma.com/v2/webhooks",
    method: "post",
    headers: {
      "X-Figma-Token": process.env.FIGMA_API_KEY,
    },
    data: {
      file_key: process.env.FIGMA_DOC_ID,
      event_type: "LIBRARY_PUBLISH",
      team_id: process.env.FIGMA_TEAM_ID,
      passcode,
      endpoint,
    },
  });
  console.log(`🎣 Webhook ${response.data.id} successfully created\n`);
});

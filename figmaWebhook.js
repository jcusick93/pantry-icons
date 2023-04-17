const express = require('express')
const bodyParser = require('body-parser')
const ngrok = require('ngrok')
const axios = require('axios')
const crypto = require('crypto')
require('dotenv').config();

const PORT = 3000
const app = express()
const passcode = crypto.randomBytes(48).toString('hex')

app.use(bodyParser.json())

app.post('/', (request, response) => {
  if (request.body.passcode === passcode) {
    const { file_name, timestamp, triggered_by, version, description, handle } = request.body

    console.log(`📁 File name: ${file_name}\n⏰ Updated on: ${timestamp}.\n` + (triggered_by && triggered_by.handle ? `😎 Updated by: ${triggered_by.handle}.\n` : '') + `📝 Notes: ${description}\n\n===================================================\n`)
    response.sendStatus(200)
  } else {
    response.sendStatus(403)
  }
})

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

ngrok.connect(PORT).then(async (endpoint) => {
  const response = await axios({
    url: 'https://api.figma.com/v2/webhooks',
    method: 'post',
    headers: {
      'X-Figma-Token': process.env.FIGMA_API_KEY,
    },
    data: {
      file_key: process.env.FIGMA_DOC_ID,
      event_type: 'LIBRARY_PUBLISH',
      team_id: process.env.FIGMA_TEAM_ID,
      passcode,
      endpoint,
    },
  })
  console.log(`🎣 Webhook ${response.data.id} successfully created`)
})

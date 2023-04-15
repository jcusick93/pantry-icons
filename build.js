const axios = require('axios')
const fs = require('fs')
const path = require('path')
require('dotenv').config();

// the api key stored in .env
const figmaApiKey = process.env.FIGMA_API_KEY;
// the doc id stored in .env
const figmaDocId = process.env.FIGMA_DOC_ID;




const options = {
  headers: {
    'X-Figma-Token': figmaApiKey
  }
}

axios(`https://api.figma.com/v1/files/${figmaDocId}`, options).then(res => {
  const file = res.data
  const ids = Object.keys(file.components).toString()

  ;(async () => {
    const res = await axios(`https://api.figma.com/v1/images/${figmaDocId}/?ids=${ids}&format=svg`, options)
    const urls = res.data.images

      for (const [componentId, componentUrl] of Object.entries(urls)) {
        const componentNode = file.components[componentId];
        const componentName = componentNode.name;
        // const name = componentName.replace(/\s+/g, '-').toLowerCase();
        const svg = (await axios(componentUrl)).data;
        const filePath = path.join(__dirname, 'src/svgs', `${componentName}.svg`);
        fs.writeFileSync(filePath, svg);
        console.log(`Wrote ${componentName}.svg`);
      }
  })()
})




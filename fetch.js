const axios = require('axios')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// the api key stored in .env
const figmaApiKey = process.env.FIGMA_API_KEY
// the doc id stored in .env
const figmaDocId = process.env.FIGMA_DOC_ID

const options = {
  headers: {
    'X-Figma-Token': figmaApiKey
  }
}

axios(`https://api.figma.com/v1/files/${figmaDocId}`, options).then(res => {
  const file = res.data
  const ids = Object.keys(file.components).toString()

  // Save existing component names to an array
  const existingComponentNames = fs.readdirSync(path.join(__dirname, 'src/svgs')).map(fileName => {
    return fileName.replace('.svg', '')
  })

  ;(async () => {
    const res = await axios(`https://api.figma.com/v1/images/${figmaDocId}/?ids=${ids}&format=svg`, options)
    const urls = res.data.images
    let totalIconsAdded = 0

    for (const [componentId, componentUrl] of Object.entries(urls)) {
      const componentNode = file.components[componentId]
      const componentName = componentNode.name
      const fileName = `${componentName}.svg`
      const filePath = path.join(__dirname, 'src/svgs', fileName)

      console.log(`Component Name: ${componentName} - Component ID: ${componentId}`)

      if (fs.existsSync(filePath)) {
        console.log(`✅ ${fileName} synced`)
        // Remove the component name from the existingComponentNames array
        const index = existingComponentNames.indexOf(componentName)
        if (index > -1) {
          existingComponentNames.splice(index, 1)
        }
      } else {
        const svg = (await axios(componentUrl)).data
        fs.writeFileSync(filePath, svg)
        console.log(`✅ Created ${fileName}`)
        totalIconsAdded++
      }
    }

    console.log(`${totalIconsAdded} icons added`)

    // Delete old SVG files that are no longer used
    for (const componentName of existingComponentNames) {
      const fileName = `${componentName}.svg`
      const filePath = path.join(__dirname, 'src/svgs', fileName)
      fs.unlinkSync(filePath)
      console.log(`❌ Removed ${fileName}`)
    }
  })()
})

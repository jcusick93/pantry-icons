const axios = require("axios");
const fs = require("fs");
require("dotenv").config();
const path = require("path");

// the api key stored in .env
const figmaApiKey = process.env.FIGMA_API_KEY;
// the doc id stored in .env
const figmaDocId = process.env.FIGMA_DOC_ID;

// set up the API endpoint URL and your personal access token
const apiUrl = "https://api.figma.com/v1";

// set up the file key for the file you want to access
const fileKey = process.env.FIGMA_DOC_ID;

// make the API request to get the file
axios
  .get(`${apiUrl}/files/${fileKey}`, {
    headers: {
      "X-Figma-Token": process.env.FIGMA_API_KEY,
    },
  })
  .then((response) => {
    // get the root node of the file
    const rootNode = response.data.document;

    // recursively list out all the child nodes of the root node
    listNodes(rootNode);
  })
  .catch((error) => {
    console.log(error);
  });

// recursive function to list out all the child nodes of a given node
function listNodes(node, componentName) {
  // check if the node has any children
  if (node.children) {
    // loop through each child node
    node.children.forEach((child) => {
      // check if the child is a ComponentSet
      if (child.type === "COMPONENT_SET") {
        // update the componentName variable
        componentName = child.name;
        // recursively list out all the child nodes of the ComponentSet
        listNodes(child, componentName);
      } else if (child.type === "COMPONENT") {
        // make the API request to get the image URL for the Component
        axios
          .get(`${apiUrl}/images/${figmaDocId}?ids=${child.id}&format=svg`, {
            headers: {
              "X-Figma-Token": figmaApiKey,
            },
          })
          .then((response) => {
            // extract the image URL from the response
            const imageUrl = response.data.images[child.id];
            // make another API request to get the SVG data
            axios
              .get(imageUrl)
              .then((response) => {
                const componentNameFormatted = componentName.toLowerCase();
                const childNameFormatted = child.name
                  .split(",")
                  .map((arg) => arg.split("=")[1])
                  .join("-");
                // create the file name in the desired format
                const fileName = `${componentNameFormatted}-${childNameFormatted}.svg`;
                const dirPath = path.join(__dirname, "src/svgs");

                // Get an array of existing file names in the directory
                const existingFileNames = fs.readdirSync(dirPath);

                // Get an array of new file names generated from Figma
                const newFileNames = node.children
                  .filter((child) => child.type === "COMPONENT")
                  .map((child) => {
                    const componentNameFormatted = componentName.toLowerCase();
                    const childNameFormatted = child.name
                      .split(",")
                      .map((arg) => arg.split("=")[1])
                      .join("-");
                    return `${componentNameFormatted}-${childNameFormatted}.svg`;
                  });

                // Filter out the files that match with the new file names
                const filesToRemove = existingFileNames.filter(
                  (name) => !newFileNames.includes(name)
                );

                if (filesToRemove.length > 0) {
                  // Delete the files that don't match
                  filesToRemove.forEach((fileName) => {
                    const filePath = path.join(dirPath, fileName);
                    fs.unlinkSync(filePath);
                    console.log(`❌ Removed ${fileName}`);
                  });
                }

                const filePath = path.join(dirPath, fileName);
                fs.writeFile(filePath, response.data, (error) => {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log(`✅ Created ${fileName}`);
                  }
                });
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        // recursively list out all the child nodes of the current node
        listNodes(child, componentName);
      }
    });
  }
}

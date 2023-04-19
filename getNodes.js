const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

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
function listNodes(node) {
  // check if the node has any children
  if (node.children) {
    // loop through each child node
    node.children.forEach((child) => {
      // check if the child is a ComponentSet
      if (child.type === "COMPONENT_SET") {
        // loop through each child of the ComponentSet
        child.children.forEach((component) => {
          // check if the child is a Component
          if (component.type === "COMPONENT") {
            // make the API request to get the SVG for the Component
            axios
              .get(
                `${apiUrl}/images/${figmaDocId}?ids=${component.id}&format=svg`,

                {
                  headers: {
                    "X-Figma-Token": figmaApiKey,
                  },
                  responseType: "text",
                }
              )
              .then((response) => {
                // get the SVG path from the response
                const svgPath = JSON.parse(response.data).images[
                  `${component.id}`
                ];

                // save the SVG path to a file
                const fileName = `./src/svgs/${child.name}-${component.name}.svg`;
                fs.writeFile(fileName, svgPath, (error) => {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log(`File saved: ${fileName}`);
                  }
                });
              })
              .catch((error) => {
                console.log(error);
              });
          }
        });
      } else {
        // recursively call this function on each child node
        listNodes(child);
      }
    });
  }
}

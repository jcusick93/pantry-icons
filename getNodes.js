const axios = require("axios");
const fs = require("fs");
require("dotenv").config();
const path = require("path");

// The api key stored in .env
const figmaApiKey = process.env.FIGMA_API_KEY;

// Sets up the API endpoint URL and your personal access token
const apiUrl = "https://api.figma.com/v1";

// Sets up the file key for the file you want to access
const fileKey = process.env.FIGMA_FILE_KEY;

// The directory path
const dirPath = path.join(__dirname, "dist/svgs");

// Get an array of existing file names in the directory
const existingFileNames = fs.readdirSync(dirPath);

// initializes the file names array
let fileNamesFromFigma = [];

// Initializes the total icons synced variable
let totalIconsSynced = 0;

// Initializes the total icons removed variable
let totalIconsRemoved = 0;

console.log(`✅ Syncing icons...\n`);

// make the API request to get the file
axios

  .get(`${apiUrl}/files/${fileKey}`, {
    headers: {
      "X-Figma-Token": figmaApiKey,
    },
  })

  .then((response) => {
    // get the root node of the file
    const rootNode = response.data.document;

    // function to recursively list out all the child nodes of the root node
    listNodes(rootNode);

    // removes unwanted icons function
    removeUnWantedIcons();
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

        componentName = child.name; // recursively list out all the child nodes of the ComponentSet

        listNodes(child, componentName);
      } else if (child.type === "COMPONENT") {
        const componentNameFormatted = componentName
          .toLowerCase()
          .replace(/\s+/g, "_");

        const childNameFormatted = child.name

          .split(",")

          .map((arg) => arg.split("=")[1])

          .join("_");

        // create the file name in the desired format

        const fileName = `${componentNameFormatted}_${childNameFormatted}.svg`;

        fileNamesFromFigma.push(fileName);
        // make the API request to get the image URL for the Component

        axios

          .get(`${apiUrl}/images/${fileKey}?ids=${child.id}&format=svg`, {
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
                const filePath = path.join(dirPath, fileName);

                fs.writeFile(filePath, response.data, (error) => {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log(`✅ Synced ${fileName}`);
                    totalIconsSynced++;
                    if (totalIconsSynced === fileNamesFromFigma.length) {
                      console.log(
                        `\n✨ Synced a total of ${totalIconsSynced} icons.\n`
                      );
                    }
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

function removeUnWantedIcons() {
  if (fileNamesFromFigma.length != 0) {
    // Filter out the files that match with the new file names
    const filesToRemove = existingFileNames.filter(
      (name) => !fileNamesFromFigma.includes(name)
    );

    if (filesToRemove.length > 0) {
      // Delete the files that don't match
      filesToRemove.forEach((fileName) => {
        const filePath = path.join(dirPath, fileName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);

          console.log(`❌ Removed ${fileName}`);
          totalIconsRemoved++;
          if (totalIconsRemoved === filesToRemove.length) {
            console.log(`\n🗑 Removed a total of ${totalIconsRemoved} icons.\n`);
          }
        }
      });
    }
  }
}

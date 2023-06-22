const axios = require("axios");
const fs = require("fs");
require("dotenv").config();
const path = require("path");
const readline = require("readline");

// The api key stored in .env
const figmaApiKey = process.env.FIGMA_API_KEY;

// Sets up the API endpoint URL and your personal access token
const apiUrl = "https://api.figma.com/v1";

// Sets up the file key for the file you want to access
const fileKey = process.env.FIGMA_FILE_KEY;

// The label for the console timer
const timerMessage = `⏰ Completed build in`;

// Counter for API calls
let apiCallsCounter = 0;

// The directory path
const dirPath = "./src/icons/svgs";

// Get an array of existing file names in the directory
const existingFileNames = fs.readdirSync(dirPath);

// Initializes the file names array
let fileNamesFromFigma = [];

// Initializes the total icons synced variable
let totalIconsSynced = 0;

// Initializes the total icons removed variable
let totalIconsRemoved = 0;

console.log(`✅ Syncing icons...\n`);

// Start the timer
console.time(timerMessage);

// make the API request to get the file
axios
  .get(`${apiUrl}/files/${fileKey}`, {
    headers: {
      "X-Figma-Token": figmaApiKey,
    },
  })
  .then(async (response) => {
    // get the root node of the file
    const rootNode = response.data.document;

    // function to recursively list out all the child nodes of the root node
    await listNodes(rootNode);
  })
  .catch((error) => {
    console.log(error);
  });

// recursive function to list out all the child nodes of a given node
async function listNodes(node, componentName) {
  return new Promise(async (resolve) => {
    if (node.children) {
      for (const child of node.children) {
        if (child.type === "COMPONENT_SET") {
          componentName = child.name;
          await listNodes(child, componentName);
        } else if (child.type === "COMPONENT") {
          const componentNameFormatted = componentName
            .toLowerCase()
            .replace(/\s+/g, "_");

          const childNameFormatted = child.name
            .split(",")
            .map((arg) => arg.split("=")[1])
            .join("_")
            .toLowerCase();

          const fileName = `${componentNameFormatted}_${childNameFormatted}.svg`;

          fileNamesFromFigma.push(fileName);

          await axios
            .get(`${apiUrl}/images/${fileKey}?ids=${child.id}&format=svg`, {
              headers: {
                "X-Figma-Token": figmaApiKey,
              },
            })
            .then(async (response) => {
              const imageUrl = response.data.images[child.id];

              await axios
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
                        removeUnWantedIcons();
                        console.timeEnd(timerMessage);
                        console.log("\n");
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
          await listNodes(child, componentName);
        }
      }
    }
    resolve();
  });
}

function removeUnWantedIcons() {
  if (fileNamesFromFigma.length != 0) {
    const filesToRemove = existingFileNames.filter(
      (name) => name.endsWith(".svg") && !fileNamesFromFigma.includes(name)
    );

    if (filesToRemove.length > 0) {
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

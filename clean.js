const fs = require("fs");
const path = require("path");
const srcDir = "./dist/svgs";
const distDir = "./dist/svgs";

let totalCleaned = 0;

console.log(`✅ Executing cleaning script...\n`);

fs.readdir(srcDir, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach((file) => {
    const filePath = path.join(srcDir, file);

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      // Add fill="currentColor" to the SVG element
      let svgData = data.replace(/<svg/, '<svg fill="currentColor"');

      // Remove empty lines
      svgData = svgData.replace(/^\s*\n/gm, "");

      const outputFilePath = path.join(distDir, path.basename(file)); // extract file name
      fs.writeFile(outputFilePath, svgData, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`🧽 Cleaned ${path.basename(outputFilePath)}`); // extract file name
        // Increment the totalCleaned count and log the message after all files have been processed
        totalCleaned++;
        if (totalCleaned === files.length) {
          console.log(`\n✨ Cleaned a total of ${totalCleaned} icons.\n`);
        }
      });
    });
  });
});

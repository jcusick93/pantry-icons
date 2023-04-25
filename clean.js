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

      // Create a new SVG element
      let svgData = "<svg";

      // Extract height, width, and viewBox attributes
      const matchHeight = data.match(/height="[^"]*"/);
      const matchWidth = data.match(/width="[^"]*"/);
      const matchViewBox = data.match(/viewBox="[^"]*"/);
      if (matchHeight) {
        svgData += ` ${matchHeight[0]}`;
      }
      if (matchWidth) {
        svgData += ` ${matchWidth[0]}`;
      }
      if (matchViewBox) {
        svgData += ` ${matchViewBox[0]}`;
      }

      // Close the SVG element tag
      svgData += ">";

      // Extract paths and merge them into one
      const matchPaths = data.match(/<path.*?d="([^"]*)".*?>/gi);
      if (matchPaths) {
        let mergedPath = "";
        matchPaths.forEach((matchPath) => {
          const pathD = matchPath.match(/d="([^"]*)"/)[1];
          mergedPath += pathD;
        });
        // Add the merged path to the SVG element
        svgData += `<path d="${mergedPath}"/>`;
      }

      // Close the SVG element
      svgData += "</svg>";

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
          console.log(`\n✨ Cleaned a total of: ${totalCleaned} icons.\n`);
        }
      });
    });
  });
});

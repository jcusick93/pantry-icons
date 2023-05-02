const fs = require("fs");
const pathModule = require("path");
const { JSDOM } = require("jsdom");

const srcDir = "./src/svgs";
const iosDir = "./dist/ios";

let totalProcessed = 0;
let totalRemoved = 0;

console.log(`🍎 Building iOS icons...\n`);

// Remove SVG files that are no longer needed
const existingIosFiles = fs.readdirSync(iosDir);
existingIosFiles.forEach((iosFileName) => {
  if (!iosFileName.endsWith(".svg")) return;

  const correspondingSvgFileName = iosFileName;
  const svgPath = pathModule.join(srcDir, correspondingSvgFileName);

  if (!fs.existsSync(svgPath)) {
    const iosPath = pathModule.join(iosDir, iosFileName);
    fs.unlinkSync(iosPath);

    console.log(`❌ Removed ${iosFileName}`);
    totalRemoved++;
  }
});

if (totalRemoved > 0) {
  console.log(`\n🗑  Removed a total of ${totalRemoved} icons.\n`);
}

// Create the SVG icons in dist/ios
fs.readdir(srcDir, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach((file) => {
    const svgPath = pathModule.join(srcDir, file);

    fs.readFile(svgPath, "utf8", (err, svgData) => {
      if (err) {
        console.error(err);
        return;
      }

      const dom = new JSDOM(svgData);
      const svg = dom.window.document.querySelector("svg");

      // Create a new <svg> element
      const newSvg = dom.window.document.createElement("svg");

      // Merge all paths into one
      let pathData = "";
      svg.querySelectorAll("path").forEach((path) => {
        pathData += path.getAttribute("d");
      });

      // Add the merged path as a child <path> element
      const newPath = dom.window.document.createElement("path");
      newPath.setAttribute("d", pathData);
      newSvg.appendChild(newPath);

      // Copy viewBox, width, and height attributes to the new <svg> element
      ["viewBox", "width", "height"].forEach((attr) => {
        const value = svg.getAttribute(attr);
        if (value) {
          newSvg.setAttribute(attr, value);
        }
      });

      // Serialize the modified SVG
      const svgDataOutput = newSvg.outerHTML;

      const outputFilePath = pathModule.join(iosDir, pathModule.basename(file)); // extract file name
      fs.writeFile(outputFilePath, svgDataOutput, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`✅ Synced ${pathModule.basename(outputFilePath)}`);
        totalProcessed++;

        if (totalProcessed === files.length) {
          console.log(`\n✨ Synced a total of ${totalProcessed} icons.\n`);
        }
      });
    });
  });
});

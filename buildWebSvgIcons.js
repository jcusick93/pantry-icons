const fs = require("fs");
const pathModule = require("path");
const { JSDOM } = require("jsdom");

const srcDir = "./src/svgs";
const webDir = "./dist/web";

let totalProcessed = 0;
let totalRemoved = 0;

console.log(`🌐 Building web SVG icons...\n`);

// Remove SVG files that are no longer needed
const existingwebFiles = fs.readdirSync(webDir);
existingwebFiles.forEach((webFIleName) => {
  if (!webFIleName.endsWith(".svg")) return;

  const correspondingSvgFileName = webFIleName;
  const svgPath = pathModule.join(srcDir, correspondingSvgFileName);

  if (!fs.existsSync(svgPath)) {
    const webPath = pathModule.join(webDir, webFIleName);
    fs.unlinkSync(webPath);

    console.log(`❌ Removed ${webFIleName}`);
    totalRemoved++;
  }
});

if (totalRemoved > 0) {
  console.log(`\n🗑  Removed a total of ${totalRemoved} icons.\n`);
}

// Create the SVG icons in dist/web
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

      // Set the "fill" attribute to "currentColor"
      newSvg.setAttribute("fill", "currentColor");

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

      const outputFilePath = pathModule.join(webDir, pathModule.basename(file)); // extract file name
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

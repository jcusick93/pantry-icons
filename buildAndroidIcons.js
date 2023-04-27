const fs = require("fs");
const pathModule = require("path");
const { JSDOM } = require("jsdom");

const srcDir = "./src/svgs";
const distDir = "./dist/android";

let totalProcessed = 0;
let totalRemoved = 0;

console.log(`🤖 Building Android icons...\n`);

// Remove XML files that are no longer needed
const existingXmlFiles = fs.readdirSync(distDir);

existingXmlFiles.forEach((xmlFileName) => {
  if (!xmlFileName.endsWith(".xml")) return;

  const correspondingSvgFileName = xmlFileName.replace(".xml", ".svg");
  const svgPath = pathModule.join(srcDir, correspondingSvgFileName);

  if (!fs.existsSync(svgPath)) {
    const xmlPath = pathModule.join(distDir, xmlFileName);
    fs.unlinkSync(xmlPath);

    console.log(`❌ Removed ${xmlFileName}`);
    totalRemoved++;
  }
});

if (totalRemoved > 0) {
  console.log(`\n🗑  Removed a total of ${totalRemoved} icons.\n`);
}

// Create the XML files in dist/android
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

      // Add fill="currentColor" to the SVG element
      let cleanedSvgData = svgData.replace(/<svg/, '<svg fill="currentColor"');

      // Remove empty lines
      cleanedSvgData = cleanedSvgData.replace(/^\s*\n/gm, "");

      const { document } = new JSDOM(cleanedSvgData).window;

      const svgElem = document.querySelector("svg");
      const widthPx = svgElem.getAttribute("width");
      const heightPx = svgElem.getAttribute("height");
      const viewBox = svgElem.getAttribute("viewBox");
      const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] =
        viewBox.split(" ");

      const width = widthPx ? widthPx.replace("px", "") : viewBoxWidth;
      const height = heightPx ? heightPx.replace("px", "") : viewBoxHeight;

      const path = document.querySelector("path").getAttribute("d");

      const vectorXml = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${width}dp"
    android:height="${height}dp"
    android:viewportWidth="${viewBoxWidth}"
    android:viewportHeight="${viewBoxHeight}">
    <path
        android:fillColor="#000000"
        android:pathData="${path}" />
</vector>`;

      const xmlFileName = file.replace(".svg", ".xml");
      const xmlPath = pathModule.join(distDir, xmlFileName);

      fs.writeFile(xmlPath, vectorXml, (err) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log(`✅ Synced ${xmlFileName}`);
        totalProcessed++;
        if (totalProcessed === files.length) {
          console.log(`\n✨ Synced a total of ${totalProcessed} icons.\n`);
        }
      });
    });
  });
});

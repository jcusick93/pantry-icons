const fs = require("fs");
const { JSDOM } = require("jsdom");
const pathModule = require("path");

const svgsDir = "./dist/svgs";
const androidDir = "./dist/android";

console.log(`🤖 Building XML files for Android...\n`);

// Get an array of existing SVG and XML file names in their respective directories
const existingSVGFiles = fs.readdirSync(svgsDir);
const existingXMLFiles = fs.readdirSync(androidDir);

// Loop through SVG files and create corresponding XML files
let totalIconsSynced = 0;

existingSVGFiles.forEach((svgFileName) => {
  if (!svgFileName.endsWith(".svg")) return;

  const svgFilePath = pathModule.join(svgsDir, svgFileName);
  const svg = fs.readFileSync(svgFilePath, "utf8");
  const { document } = new JSDOM(svg).window;

  const svgElem = document.querySelector("svg");
  const widthPx = svgElem.getAttribute("width");
  const heightPx = svgElem.getAttribute("height");
  const viewBox = svgElem.getAttribute("viewBox");
  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox.split(" ");

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

  const xmlFileName = svgFileName.replace(".svg", ".xml");
  const xmlFilePath = pathModule.join(androidDir, xmlFileName);

  fs.writeFileSync(xmlFilePath, vectorXml);
  console.log(`✅ Synced ${xmlFileName}`);

  totalIconsSynced++;
});

console.log(`\n✨ Synced a total of ${totalIconsSynced} icons.\n`);

// Loop through existing XML files and remove any that are no longer needed
if (existingXMLFiles.length > 0) {
  const filesToRemove = existingXMLFiles.filter(
    (xmlFileName) =>
      !existingSVGFiles.includes(xmlFileName.replace(".xml", ".svg"))
  );

  if (filesToRemove.length > 0) {
    let totalIconsRemoved = 0;

    filesToRemove.forEach((xmlFileName) => {
      const xmlFilePath = pathModule.join(androidDir, xmlFileName);

      if (fs.existsSync(xmlFilePath)) {
        fs.unlinkSync(xmlFilePath);

        console.log(`❌ Removed ${xmlFileName}`);
        totalIconsRemoved++;
      }
    });

    console.log(`\n🗑 Removed a total of ${totalIconsRemoved} icons.\n`);
  }
}

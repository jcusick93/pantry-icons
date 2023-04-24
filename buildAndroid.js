const fs = require("fs");
const { JSDOM } = require("jsdom");
const svgsDir = "./dist/svgs";
const androidDir = "./dist/android";

console.log(`🤖 Building XML files for Android...\n`);

fs.readdir(svgsDir, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  // Initializes the count of icons synced.
  const totalIcons = files.length;
  let totalIconsSynced = 0;

  files.forEach((file) => {
    const svg = fs.readFileSync(`${svgsDir}/${file}`, "utf8");
    const { document } = new JSDOM(svg).window;

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

    const fileName = file.replace(".svg", ".xml");
    fs.writeFileSync(`${androidDir}/${fileName}`, vectorXml);
    console.log(`✅ Synced ${fileName}`);

    totalIconsSynced++;
    if (totalIconsSynced === totalIcons) {
      console.log(`\n✨ Synced a total of ${totalIconsSynced} icons.\n`);
    }
  });
});

const fs = require("fs");
const { JSDOM } = require("jsdom");
const path = require("path");

const srcDir = "./dist/svgs";
const distDir = "./dist/svgs";

let totalCleaned = 0;

console.log(`✅ Executing cleaning script...`);

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

      const dom = new JSDOM(data, { contentType: "image/svg+xml" });

      const { document } = dom.window;
      function removeAttributes(element) {
        element.removeAttribute("fill");
        element.removeAttribute("viewBox");
        element.removeAttribute("clip-rule");
        element.removeAttribute("fill-rule");
        const children = element.children;
        const paths = element.querySelectorAll("path");
        if (paths.length > 1) {
          // Merge all paths into one
          let mergedPath = "";
          paths.forEach((path) => {
            mergedPath += path.getAttribute("d");
          });
          // Remove all but the first path element
          paths.forEach((path, index) => {
            if (index !== 0) {
              path.remove();
            }
          });
          // Set the d attribute of the first path element to the merged path
          paths[0].setAttribute("d", mergedPath);
        } else if (paths.length === 1) {
          // Extract the d attribute from the path within the g element
          const gElement = element.querySelector("g");
          if (gElement) {
            const pathElement = gElement.querySelector("path");
            if (pathElement) {
              const dAttribute = pathElement.getAttribute("d");
              // Remove the g and clipPath elements
              gElement.remove();
              const clipPathElement = element.querySelector("clipPath");
              if (clipPathElement) {
                clipPathElement.remove();
              }
              // Set the d attribute of the remaining path element to the extracted d attribute
              paths[0].setAttribute("d", dAttribute);
            }
          }
        }
        for (let i = 0; i < children.length; i++) {
          removeAttributes(children[i]);
        }
      }
      const svgElement = document.querySelector("svg");
      removeAttributes(svgElement);
      const outputFilePath = path.join(distDir, file);
      fs.writeFile(outputFilePath, dom.serialize(), (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`🧽 Successfully cleaned SVG file: ${outputFilePath}`);

        // Increment the totalCleaned count and log the message after all files have been processed
        totalCleaned++;
        if (totalCleaned === files.length) {
          console.log(`✨ Cleaned a total of: ${totalCleaned} icons.`);
        }
      });
    });
  });
});

import { promises } from "fs";
import { join } from "path";
import { optimize, extendDefaultPlugins } from "svgo";

const { readFile, readdir, writeFile } = promises;

const COLORS: { [x: string]: string } = {
  "#ababab": "fg",
  "#56a3bc": "ac",
  "#cce3eb": "ac",
  "#707070": "fg",
};

const EXCLUDED = ["none"];

function generateId(file: string): string {
  return file
    .substring(0, file.length - 4)
    .toLowerCase()
    .replace(/[ _]/g, "-");
}

function replaceAttrWithClass(ast: any) {
  const styles: string[] = [];

  function replaceSingle(name: string) {
    const value = ((ast.attributes || {})[name] || "").toLowerCase() as string;
    if (value) {
      if (COLORS[value]) {
        styles.push(name + ": var(--svg-" + COLORS[value] + ")");
      }
      if (!EXCLUDED.includes(value)) {
        delete ast.attributes[name];
      }
    }
  }

  replaceSingle("fill");
  replaceSingle("stroke");

  if (styles.length) {
    ast.attributes.style = styles.join("; ");
  }
}

function replaceSvgWithSymbol(id: string, ast: any) {
  if (ast.name === "svg") {
    ast.name = "symbol";
    ast.attributes.id = id;
  }
}

function performOptimization(content: string): string {
  return optimize(content, {
    multipass: true,
    plugins: extendDefaultPlugins([
      {
        name: "inlineStyles",
        params: {
          onlyMatchedOnce: false,
          removeMatchedSelectors: true,
        },
      },
      {
        name: "convertStyleToAttrs",
      },
      {
        name: "removeDimensions",
      },
      {
        name: "removeAttrs",
        params: {
          elemSeparator: "#",
          attrs: [
            "*#^data-.+$#*",
            "*#^style$#*",
            "*#^opacity$#*",
            "^svg$#^(xmlns|version|x|y|xml:space)$#*",
          ],
        },
      },
      {
        name: "removeStyleElement",
      },
    ]),
  }).data;
}

function performReplacement(id: string, content: string): string {
  return optimize(content, {
    plugins: [
      {
        name: "replaceAttrWithClass",
        type: "perItem",
        fn: replaceAttrWithClass,
      },
      {
        name: "replaceSvgWithSymbol",
        type: "perItem",
        fn: replaceSvgWithSymbol.bind(null, id),
      },
    ],
  }).data;
}

const ICONS_FOLDER = join(__dirname, "icons");

async function processFile(file: string): Promise<string> {
  const content = await readFile(join(ICONS_FOLDER, file), {
    encoding: "utf-8",
  });

  return performReplacement(generateId(file), performOptimization(content));
}

async function generateSprite(): Promise<string> {
  const symbols = await Promise.all(
    (await readdir(ICONS_FOLDER)).map(processFile)
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join(
    ""
  )}</svg>`;
}

const OUTPUT_FOLDER = join(__dirname, "output");
async function generateHtml() {
  await writeFile(
    join(OUTPUT_FOLDER, "index.html"),
    `
        <html>
            <head>
                <style>
                    use { 
                        fill: none
                    }
                    svg {
                        width: 75px;
                        --svg-fg: gray;
                        --svg-ac: none;
                    }
                    .accented svg {
                        --svg-ac: blue;
                    }
                    .heavy.accented svg {
                        --svg-fg: black;
                        --svg-ac: red;
                    }
                    .pink.accented svg {
                        --svg-fg: black;
                        --svg-ac: pink;
                    }
                    .purple.accented svg {
                        --svg-fg: black;
                        --svg-ac: purple;
                    }
                    .yellow.accented svg {
                        --svg-fg: black;
                        --svg-ac: yellow;
                    }
                    .green.accented svg {
                        --svg-fg: black;
                        --svg-ac: green;
                    }
                </style>
            </head>
            <body>
                ${await generateSprite()}
                <div>
                    <svg viewBox="0 0 100 100"><use xlink:href="#car-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#calendar-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#group-16580" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#offices-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#place-chair-2-colors" /></svg>
                </div>
                <div class="accented">
                    <svg viewBox="0 0 100 100"><use xlink:href="#car-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#calendar-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#group-16580" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#offices-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#place-chair-2-colors" /></svg>
                </div>
                <div class="heavy accented">
                    <svg viewBox="0 0 100 100"><use xlink:href="#car-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#calendar-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#group-16580" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#offices-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#place-chair-2-colors" /></svg>
                </div>
                <div class="pink accented">
                    <svg viewBox="0 0 100 100"><use xlink:href="#car-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#calendar-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#group-16580" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#offices-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#place-chair-2-colors" /></svg>
                </div>
                <div class="purple accented">
                    <svg viewBox="0 0 100 100"><use xlink:href="#car-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#calendar-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#group-16580" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#offices-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#place-chair-2-colors" /></svg>
                </div>
                <div class="yellow accented">
                    <svg viewBox="0 0 100 100"><use xlink:href="#car-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#calendar-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#group-16580" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#offices-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#place-chair-2-colors" /></svg>
                </div>
                <div class="green accented">
                    <svg viewBox="0 0 100 100"><use xlink:href="#car-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#clock" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#calendar-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#group-16580" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#offices-2-colors" /></svg>
                    <svg viewBox="0 0 100 100"><use xlink:href="#place-chair-2-colors" /></svg>
                </div>
            </body>
        </html>
    `,
    { encoding: "utf-8" }
  );
}

generateHtml();

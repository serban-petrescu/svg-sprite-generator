import express from "express";
import { json } from "body-parser";
import serverlessExpress from "@vendia/serverless-express";
import { optimize, extendDefaultPlugins } from "svgo";

import index from "./index.html";

const COLORS: { [x: string]: string } = {
  "#ababab": "fg",
  "#56a3bc": "ac",
  "#cce3eb": "ac",
  "#707070": "fg",
};

const EXCLUDED = ["none"];

function replaceAttrWithClass(ast) {
  const styles: string[] = [];

  function replaceSingle(name) {
    const value = ((ast.attributes || {})[name] || "").toLowerCase();
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

function replaceSvgWithSymbol(id, ast) {
  if (ast.name === "svg") {
    ast.name = "symbol";
    ast.attributes.id = id;
  }
}

function performOptimization(content) {
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

function performReplacement(id, content) {
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

async function generateSprite(svgs: string[]): Promise<string> {
  const symbols = svgs.map((svg, index) =>
    performReplacement("svg-" + index, performOptimization(svg))
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join(
    ""
  )}</svg>`;
}

const router = express.Router();
router.use(json());

router.get("/", (req, res) => res.status(200).type("html").send(index));

router.post("/process", async (req, res) => {
  const sprite = await generateSprite(req.body);
  res.status(200).type("svg").send(sprite);
});

const app = express();
app.use(router);
exports.handler = serverlessExpress({ app });

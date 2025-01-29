/* eslint-disable max-len */
const fs = require("fs");
const axios = require("axios");
const { diffLines } = require("diff");
const errorLogStream = fs.createWriteStream("error.log", { flags: "a" });

function handleErrors(error) {
  errorLogStream.write(`${new Date().toISOString()} - ERROR: ${error.stack}\n`);
}

async function getEnvArray() {
  let sss = await axios.get(
    "https://main--fancy-khapse-60cb44.netlify.app/assets/index-CYJlB2HC.js"
  );
  let stringContainingArray = sss.data;

  const regex = /S0=\[([^\]]+)\]/;
  const match = stringContainingArray.match(regex);
  let Wd = [];

  if (match && match[1]) {
    Wd = match[1].split(",").map((item) => item.trim().replace(/"/g, ""));
  }

  return Wd;
}

function fc(e, n) {
  const t = Object.keys(n);
  let r = {};
  for (let l = 0; t.length > l; l++) {
    const i = [];
    const o = t[l];
    const u = Object.keys(n[o]);
    Object.keys(e[o] || {}).forEach((s) => {
      u.indexOf(s) < 0 && i.push(s);
    });
    i.length > 0 &&
      (r[o] = {
        count: i.length,
        words: i
          .join(" ")
          .split(" ")
          .filter((s) => !s.startsWith("{")).length,
        sentences: i,
      });
  }
  return r;
}

async function sendDifference(inputFile, outputFile, title) {
  const inputFileContents = fs.readFileSync(inputFile, "utf-8");
  const outputFileContents = fs.readFileSync(outputFile, "utf-8");

  const differences = diffLines(inputFileContents, outputFileContents);
  const deleted = [];
  const added = [];

  differences.forEach((part) => {
    if (part.added) {
      added.push(part.value);
    } else if (part.removed) {
      deleted.push(part.value);
    }
  });

  let message = `${title} - Differences found:\n\n`;

  if (deleted.length > 0) {
    message += "Deleted:\n" + deleted.join("\n") + "\n\n";
  }

  if (added.length > 0) {
    message += "Added:\n" + added.join("\n") + "\n\n";
  }

  if (deleted.length > 0 || added.length > 0) {
    console.info("NOTIFICATION GENERATED");
    // await sendNotification(message);
  } else {
    console.log(`${title} - No differences found.`);
  }

  fs.unlinkSync(inputFile);
  fs.renameSync(outputFile, inputFile);
}

async function sendNotification(message) {
  //console.log(message);

  const webhookUrl =
    "https://chat.googleapis.com/v1/spaces/AAAAuqS1Pe4/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=ndSh6oiB_jysrRrxqLiYbKxr2XCv938aKCCvnH2LNlg";

  try {
    const response = await axios.post(webhookUrl, {
      text: message,
    });
    console.log("Notification sent successfully:", response.data);
  } catch (error) {
    handleErrors(error);
  }
}

async function execute(flag = {}) {
  flag.inProgress = true;
  const stringsArray = await getEnvArray();
  console.log(stringsArray.length);

  function drawSingleLine(length) {
    return "-".repeat(length);
  }

  function drawDoubleLine(length) {
    return "=".repeat(length);
  }

  if (!fs.existsSync("files")) {
    fs.mkdirSync("files");
  }

  for (let i = 0; i < stringsArray.length; i++) {
    let string = stringsArray[i];
    string = string.charAt(0).toUpperCase() + string.slice(1);

    const outputFilePathWeb = `/tmp/${string}-web-output.txt`;
    const inputFilePathWeb = `/tmp/${string}-web-input.txt`;
    const outputFilePathPwa = `/tmp/${string}-pwa-output.txt`;
    const inputFilePathPwa = `/tmp/${string}-pwa-input.txt`;

    let s = await axios.get(
      `https://pegasicdn2.zingworks.com/${string}/build/web/translation.txt?new=2024-04-15T16:57:32.000Z`
    );
    let webcode = s.data;
    console.log(webcode + " " + string);

    let en = await axios.get(
      "https://tstcdn1.zingworks.com/Tst/build/web/translation.txt?new=2024-04-15T16:57:32.885Z"
    );
    let tstwebcode = en.data;
    console.log(tstwebcode);

    let so = await axios.get(
      `https://pegasicdn2.zingworks.com/${string}/build/pwa/translation.txt?new=2024-04-15T16:57:32.000Z`
    );
    let pwacode = so.data;
    console.log(pwacode + " " + string);

    let env = await axios.get(
      "https://tstcdn1.zingworks.com/Tst/build/pwa/translation.txt?new=2024-04-15T16:57:32.885Z"
    );
    let tstpwacode = env.data;
    console.log(tstpwacode);

    // Handle WEB section
    try {
      let Web = await axios.get(
        `https://pegasicdn2.zingworks.com/static/translation/web/${webcode}/en/messages.json`
      );
      let json1 = Web.data;

      let Web2 = await axios.get(
        `https://pegasicdn2.zingworks.com/static/translation/web/${tstwebcode}/en/messages.json`
      );
      let json2 = Web2.data;

      if (!fs.existsSync(inputFilePathWeb)) {
        fs.writeFileSync(
          inputFilePathWeb,
          drawDoubleLine(50) + "\n" + string + ":WEB\n\n"
        );
        const comparison = fc(json1, json2);
        for (const category in comparison) {
          if (comparison.hasOwnProperty(category)) {
            fs.appendFileSync(inputFilePathWeb, category + ":\n");
            fs.appendFileSync(
              inputFilePathWeb,
              "> " + comparison[category].sentences.join("\n> ") + "\n\n"
            );
          }
        }
        // continue; // Skip the difference check for the first run
      } else {
        fs.appendFileSync(
          outputFilePathWeb,
          drawDoubleLine(50) + "\n" + string + ":WEB\n\n"
        );
        const comparison = fc(json1, json2);
        for (const category in comparison) {
          if (comparison.hasOwnProperty(category)) {
            fs.appendFileSync(outputFilePathWeb, category + ":\n");
            fs.appendFileSync(
              outputFilePathWeb,
              "> " + comparison[category].sentences.join("\n> ") + "\n\n"
            );
          }
        }

        await sendDifference(
          inputFilePathWeb,
          outputFilePathWeb,
          `${string} - WEB`
        );
      }
    } catch (error) {
      handleErrors(error);
    }

    // Handle PWA section
    try {
      let PWA = await axios.get(
        `https://pegasicdn2.zingworks.com/static/translation/pwa/${pwacode}/en/messages.json`
      );
      let json11 = PWA.data;

      let PWA2 = await axios.get(
        `https://pegasicdn2.zingworks.com/static/translation/pwa/${tstpwacode}/en/messages.json`
      );
      let json12 = PWA2.data;

      if (!fs.existsSync(inputFilePathPwa)) {
        fs.writeFileSync(
          inputFilePathPwa,
          drawSingleLine(50) + "\n" + string + ":PWA\n\n"
        );
        const comparisonPwa = fc(json11, json12);
        for (const category in comparisonPwa) {
          if (comparisonPwa.hasOwnProperty(category)) {
            fs.appendFileSync(inputFilePathPwa, category + ":\n");
            fs.appendFileSync(
              inputFilePathPwa,
              "> " + comparisonPwa[category].sentences.join("\n> ") + "\n\n"
            );
          }
        }
      } else {
        fs.appendFileSync(
          outputFilePathPwa,
          drawSingleLine(50) + "\n" + string + ":PWA\n\n"
        );
        const comparisonPwa = fc(json11, json12);
        for (const category in comparisonPwa) {
          if (comparisonPwa.hasOwnProperty(category)) {
            fs.appendFileSync(outputFilePathPwa, category + ":\n");
            fs.appendFileSync(
              outputFilePathPwa,
              "> " + comparisonPwa[category].sentences.join("\n> ") + "\n\n"
            );
          }
        }

        await sendDifference(
          inputFilePathPwa,
          outputFilePathPwa,
          `${string} - PWA`
        );
      }
    } catch (error) {
      handleErrors(error);
    }
  }

  flag.inProgress = false;
}

module.exports = {
  execute,
};

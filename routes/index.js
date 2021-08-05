var express = require("express");
var router = express.Router();
const youtubedl = require("youtube-dl-exec");
const { google } = require("googleapis");
const { handlebars } = require("hbs");
const path = require("path");
const fs = require("fs");

const CLIENT_ID =
  "205401883192-f4ce46fu3fe61v6od8orjelcb007m5v5.apps.googleusercontent.com";
const CLIENT_SECRET = "ptWD_ujFZFt4KOOP6wv4Q4v3";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04F5Igyncnde1CgYIARAAGAQSNwF-L9IrtoDwt44Qrkpxjj-v2uNLjyvGhPIFw2VUUMGK-8uX16j2uVu_VKZMQ6MlypofhAUFPfQ";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

const Youtube = google.youtube({ version: "v3", auth: oauth2Client });

handlebars.registerHelper("video-list", function (items, options) {
  var out = "";
  for (var i = 0, l = items.length; i < l; i++) {
    out = out + options.fn(items[i]);
  }
  return out;
});

var videoStream = new Buffer();

/* GET home page. */
router.get("/", async function (req, res, next) {
  const { search } = req.query;
  if (videoStream) {
    console.log(videoStream);
    videoStream.destroy();
  }
  try {
    const ylist = await Youtube.search.list({
      part: "snippet",
      q: search,
      maxResults: 20,
      videoType: "videoTypeUnspecified",
    });

    res.render("index", {
      title: "KaneVideo",
      data: ylist.data.items,
      oldSearch: search,
    });
  } catch (err) {
    console.log(err);
  }
});

const removeFileParts = [
  "./videos/video1.mp4.part",
  "./videos/video2.mp4.part",
];

const videoOne = "./videos/video1.mp4";
const videoTwo = "./videos/video2.mp4";

let isDownloadFor = 1;

router.get("/load", (req, res, next) => {
  const { id } = req.query;
  let isContinueDownload = true;

  try {
    if (id) {
      console.log("Loading new video...");
      removeFileParts.map(async (filePath) => {
        if (fs.existsSync(filePath)) {
          console.log(`Exist ${filePath}`);
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(err);
              isContinueDownload = false;
            } else {
              console.log(`${filePath} is deleted!`);
            }
          });
        }
      });

      if (fs.existsSync(videoOne) && !fs.existsSync(videoTwo)) {
        isDownloadFor = 2;
      } else {
        isDownloadFor = 1;
      }

      if (isContinueDownload) {
        youtubedl(`https://www.youtube.com/watch?v=${id}`, {
          output: `videos/video${isDownloadFor}.%(ext)s`,
        });
      }
    }

    res.status(201).send({ message: "success" });
  } catch (err) {
    console.log(err);
  }
});

router.get("/video", async (req, res, next) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range Header");
  }
  // get video stat
  const videoPath = isDownloadFor === 2 ? videoTwo : videoOne;
  // Remove the rest video
  const removeVideoPath = isDownloadFor === 2 ? videoOne : videoTwo;
  if (fs.existsSync(removeVideoPath)) {
    console.log(`Exist ${removeVideoPath}`);
    await fs.unlink(removeVideoPath, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`${removeVideoPath} is deleted!`);
      }
    });
  }

  if (fs.existsSync(videoPath)) {
    console.log(`\[]/Streaming ${videoPath}`);
    const videoSize = fs.statSync(videoPath).size;

    // Parse range
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    // Create header
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
    // HTTP status 206 Partial Content
    res.writeHead(206, headers);

    videoStream = fs.createReadStream(videoPath, { start, end });
    // Stream video chunk to the client
    videoStream.on("error", () => {
      console.log("Read stream erorr!");
      res.end();
    });
  }
  videoStream.pipe(res);
});

module.exports = router;

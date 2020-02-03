/* global __dirname */

const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const pug = require("pug");

const app = express();

const credentials = {
    key: fs.readFileSync("/etc/certificates/lsv2.machine.local/Encrypted.key.insecure"),
    cert: fs.readFileSync("/etc/certificates/lsv2.machine.local/Encrypted.crt")
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const tf_KaradaSokutei = require("./Tf_KaradaSokutei");

let portHttp = 1080;
let portHttps = 1443;

let sitePath = "../public";

app.set("views", path.join(__dirname, sitePath + "/templates"));
app.set("view engine", "pug");

app.use(express.static(sitePath));

app.get("/", function(req, res) {
    res.render("index.pug");
});
app.get("/karada_sokutei", function(req, res) {
    tf_KaradaSokutei.run(function(response) {
        res.render("karada_sokutei.pug", {'response': response, 'elements': JSON.stringify(response.elements)});
    });
});

httpServer.listen(portHttp, function() {
    console.log(`Listen on ${portHttp}`);
});
httpsServer.listen(portHttps, function() {
    console.log(`Listen on ${portHttps}`);
});
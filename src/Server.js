var express = require("express");
var fs = require("fs");
var http = require("http");
var https = require("https");
var path = require("path");
var pug = require("pug");

var app = express();

var credentials = {
    key: fs.readFileSync("/etc/certificates/lsv2.machine.local/Encrypted.key.insecure"),
    cert: fs.readFileSync("/etc/certificates/lsv2.machine.local/Encrypted.crt")
};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

var portHttp = 1080;
var portHttps = 1443;

var sitePath = "../public";

var tf_KaradaSokutei = require("./Tf_KaradaSokutei");

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
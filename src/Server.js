"use strict";

/* global __dirname */

const fs = require("fs");
const express = require("express");
const http = require("http");
const https = require("https");
const pug = require("pug");
const bodyParser = require("body-parser");
const socketIo = require("socket.io");

const config = require("./Config");
const helper = require("./Helper");
const sio_Websocket = require("./Sio_Websocket");
const tf_KaradaSokutei = require("./Tf_KaradaSokutei");
const tf_Classifier = require("./Tf_Classifier");

const app = express();

const certificates = {
    'key': fs.readFileSync(config.settings.certificates.key),
    'cert': fs.readFileSync(config.settings.certificates.cert)
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(certificates, app);

const socketIoServer = socketIo(httpServer);
const socketIosServer = socketIo(httpsServer);

const portHttp = 2080;
const portHttps = 2443;

const urlRoot = "../public";

let connectionCount = 0;

app.set("views", `${urlRoot}/templates`);
app.set("view engine", "pug");

app.use(express.static(urlRoot));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended': false}));

app.get("/", (request, result) => {
    result.render("index.pug");
});
app.all("/karada_sokutei", (request, result) => {
    tf_KaradaSokutei.execute(request, (response) => {
        if (response.ajax === true)
            result.json({'response': response});
        else
            result.render("karada_sokutei.pug", {'response': response});
    });
});
app.all("/classifier", (request, result) => {
    tf_Classifier.execute(request, (response) => {
        if (response.ajax === true)
            result.json({'response': response});
        else
            result.render("classifier.pug", {'response': response});
    });
});

httpServer.listen(portHttp, () => {
    helper.writeLog(`Listen on ${portHttp}`);
});
httpsServer.listen(portHttps, () => {
    helper.writeLog(`Listen on ${portHttps}`);
    
    tf_KaradaSokutei.startup();
    
    tf_Classifier.startup();
});

socketIoServer.on("connection", (socket) => {
    //sio_Websocket.startup(socketIoServer, socket);
});
socketIosServer.on("connection", (socket) => {
    sio_Websocket.startup(socketIosServer, socket);
    
    tf_Classifier.socketEvent(socket);
});
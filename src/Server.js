"use strict";

/* global __dirname */

const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const https = require("https");
const pug = require("pug");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const httpAuth = require("http-auth");
const socketIo = require("socket.io");

const config = require("./Config");
const helper = require("./Helper");
const sio_Websocket = require("./Sio_Websocket");
const tf_RecognitionPose = require("./Tf_RecognitionPose");
const tf_RecognitionImage = require("./Tf_RecognitionImage");

const portHttp = 1080;
const portHttps = 1443;

const urlRoot = `${path.dirname(__dirname)}/public`;

const certificates = {
    'key': fs.readFileSync(config.settings.certificates.key),
    'cert': fs.readFileSync(config.settings.certificates.cert)
};

const digest = httpAuth.digest({
    realm: "Auth - Digest",
    file: `${config.settings.digest.path}/.htpasswd`
});

const app = express();

const httpServer = http.createServer(app);
const httpsServer = https.createServer(certificates, app);

const socketIoServer = socketIo(httpServer);
const socketIosServer = socketIo(httpsServer);

app.use(express.static(urlRoot));
app.use(bodyParser.urlencoded({'extended': false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csrf({'cookie': true}));

app.set("views", `${urlRoot}/templates`);
app.set("view engine", "pug");

app.get("/", config.digestCheck(digest, (request, result) => {
    result.render("index.pug", {'csrfToken': request.csrfToken()});
}));

app.all("/recognition_pose", config.digestCheck(digest, (request, result) => {
    tf_RecognitionPose.execute(request, (response) => {
        if (response.ajax === true)
            result.json({'response': response});
        else
            result.render("recognition_pose.pug", {'csrfToken': request.csrfToken(), 'response': response});
    });
}));

app.all("/recognition_image", config.digestCheck(digest, (request, result) => {
    tf_RecognitionImage.execute(request, (response) => {
        if (response.ajax === true)
            result.json({'response': response});
        else
            result.render("recognition_image.pug", {'csrfToken': request.csrfToken(), 'response': response});
    });
}));
app.all("/recognition_sound", config.digestCheck(digest, (request, result) => {
    tf_RecognitionImage.execute(request, (response) => {
        if (response.ajax === true)
            result.json({'response': response});
        else
            result.render("recognition_sound.pug", {'csrfToken': request.csrfToken(), 'response': response});
    });
}));

httpServer.listen(portHttp, () => {
    helper.writeLog(`Listen on ${portHttp}`);
});
httpsServer.listen(portHttps, () => {
    helper.writeLog(`Listen on ${portHttps}`);
    
    tf_RecognitionPose.startup();
    
    tf_RecognitionImage.startup();
});

socketIoServer.on("connection", (socket) => {
    //sio_Websocket.startup(socketIoServer, socket);
});
socketIosServer.on("connection", (socket) => {
    sio_Websocket.startup(socketIosServer, socket);

    tf_RecognitionPose.socketEvent(socketIosServer, socket);

    tf_RecognitionImage.socketEvent(socketIosServer, socket);
});
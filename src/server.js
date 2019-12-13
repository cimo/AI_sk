var path = require("path");
var express = require("express");
var pug = require("pug");

var app = express();
var sitePath = "../public_html";
var port = 8080;

var tf = require("./tf");

app.set("views", path.join(__dirname, sitePath + "/templates"));
app.set("view engine", "pug");

app.use(function(req, res, next) {
    //console.log(`${new Date()} - ${req.method} request for ${req.url}`);
    
    next();
});

app.use(express.static(sitePath));

app.listen(port, function() {
    console.log(`Listen on ${port}`);
});

app.get("/", function(req, res) {
    res.render("index.pug");
});

app.get("/karada_sokutei", function(req, res) {
    tf.run(function(response) {
        res.render("karada_sokutei.pug", {'response': response, 'elements': JSON.stringify(response.elements)});
    });
});
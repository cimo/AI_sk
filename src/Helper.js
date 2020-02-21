"use strict";

/* global */

const fs = require("fs");

exports.writeLog = (message) => {
    fs.appendFile("debug.log", `${message}\n`, () => {
        console.log(`Debug.log ${message}`);
    });
};
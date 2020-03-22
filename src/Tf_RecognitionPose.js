"use strict";

/* global __dirname */

const path = require("path");

const helper = require("./Helper");

const urlRoot = `${path.dirname(__dirname)}/public`;

let socketTag = "rp_";

let response = {
    'messages': {},
    'values': {},
    'ajax': false
};

exports.startup = async() => {
};

exports.socketEvent = async(socketIo, socket) => {
    socket.on(`${socketTag}estimatePose`, async(data) => {
        if (data !== null)
            socket.emit(`${socketTag}prediction`, data);
    });
};

exports.execute = async(request, callback) => {
    if (request.params.event === undefined && request.query.event === undefined && request.body.event === undefined) {
        //...
    }
    
    callback(response);
    
    response = {
        'messages': {},
        'values': {},
        'ajax': false
    };
};
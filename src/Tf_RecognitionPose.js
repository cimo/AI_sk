"use strict";

/* global __dirname */

const fs = require("fs");
const path = require("path");
const {Canvas, Image} = require("canvas");
const tensorFlow = require("@tensorflow/tfjs-node");
const poseNet = require("@tensorflow-models/posenet");

const helper = require("./Helper");

const urlRoot = `${path.dirname(__dirname)}/public`;

let canvas = null;
let canvasContext = null;

let posenetEntity = null;

let resolution = {'width': 640, 'height': 480};

let socketTag = "rp_";

let response = {
    'messages': {},
    'values': {},
    'ajax': false
};

exports.startup = async() => {
    posenetEntity = await poseNet.load({
        'architecture': "ResNet50",
        'outputStride': 32,
        'inputResolution': resolution,
        'quantBytes': 2
    });

    /*posenetEntity = await poseNet.load({
        'architecture': "MobileNetV1",
        'outputStride': 16,
        'inputResolution': resolution,
        'multiplier': 0.75
    });*/
};

exports.socketEvent = async(socketIo, socket) => {
    socket.on(`${socketTag}showRealtimePosition`, async(data) => {
        if (data !== null)
            socket.emit(`${socketTag}prediction`, data);
    });
};

exports.execute = async(request, callback) => {
    if (request.params.event === undefined && request.query.event === undefined && request.body.event === undefined) {
        //...
    }
    else if (request.body.event === "predictionFromImage") {
        await _predictionFromImage();

        response.ajax = true;
    }
    
    callback(response);
    
    response = {
        'messages': {},
        'values': {},
        'ajax': false
    };
};

const _predictionFromImage = async() => {
    if (posenetEntity !== null) {
        await _createImageCanvas(`${urlRoot}/files/recognition_pose/source.png`);

        let imageTensor = tensorFlow.browser.fromPixels(canvas);

        let elements = await _estimatePose(imageTensor);

        if (elements !== null) {
            response.values.canvasDataUrl = canvas.toDataURL("image/jpeg");
            response.values.elements = JSON.stringify(elements);
        }
    }
    else
        response.messages.error = "PoseNet is not ready please retry!";
}

const _createImageCanvas = async(buffer) => {
    let image = null;

    const imageLoadPromise = new Promise(resolve => {
        image = new Image();
        image.onload = resolve;
        image.src = buffer;
    });

    await imageLoadPromise;

    canvas = new Canvas(image.width, image.height);
    canvasContext = canvas.getContext("2d");

    canvasContext.drawImage(image, 0, 0);
};

const _estimatePose = async(imageTensor) => {
    let results = {'position': [], 'distance': []};

    let poses = await posenetEntity.estimateSinglePose(imageTensor, {
        'flipHorizontal': false
    });
    
    imageTensor.dispose();

    let pointSize = 5;

    for (const [key, value] of Object.entries(poses.keypoints)) {
        results.position.push({
            [value.part]: {
                'x': value.position.x,
                'y': value.position.y
            }
        });

        canvasContext.fillStyle = "blue";
        canvasContext.fillRect(value.position.x - (pointSize / 2), value.position.y - (pointSize / 2), pointSize, pointSize);
    }

    if (results.position.length > 0) {
        let distance = _findDistance(results.position[1].leftEye, results.position[2].rightEye);

        results.distance.push(distance);
    }

    return results;
};

const _findDistance = (p, q) => {
    let dx = p.x - q.x;
    let dy = p.y - q.y;
    
    return Math.sqrt(dx * dx + dy * dy);
};
"use strict";

/* global */

const fs = require("fs");
const {Canvas, Image} = require("canvas");
const tensorFlow = require("@tensorflow/tfjs-node");
const poseNet = require("@tensorflow-models/posenet");

const helper = require("./Helper");

const urlRoot = "../public";

let canvas = null;
let canvasContext = null;

let posenetEntity = null;

let resolution = {'width': 640, 'height': 480};

let response = {
    'messages': {},
    'values': {},
    'ajax': false
};

exports.startup = async() => {
    canvas = new Canvas(resolution.width, resolution.height);
    canvasContext = canvas.getContext("2d");
    
    posenetEntity = await poseNet.load({
        'architecture': "ResNet50",
        'outputStride': 32,
        'inputResolution': resolution,
        'quantBytes': 2
    });
};

exports.execute = async(request, callback) => {
    if (request.params.event === undefined && request.query.event === undefined && request.body.event === undefined) {
        //...
    }
    else if (request.body.event === "findPoint") {
        if (posenetEntity !== null) {
            let image = await createImage(`${urlRoot}/images/karada_sokutei/source.png`);
            
            canvasContext.drawImage(image, 0, 0);
            
            let imageTensor = tensorFlow.browser.fromPixels(canvas);
            
            let elements = await findPoseElement(imageTensor);
            
            if (elements !== null) {
                response.values.canvasDataUrl = canvas.toDataURL("image/jpeg");
                response.values.elements = JSON.stringify(elements);
            }
        }
        else
            response.messages.error = "PoseNet is not ready please retry!";
        
        response.ajax = true;
    }
    
    callback(response);
    
    response = {
        'messages': {},
        'values': {},
        'ajax': false
    };
};

const createImage = async(path) => {
    let image = null;
    
    const imageLoadPromise = new Promise(resolve => {
        image = new Image();
        image.onload = resolve;
        image.src = path;
    });
    
    await imageLoadPromise;
    
    return image;
};

const findPoseElement = async(imageTensor) => {
    let results = {'position': [], 'distance': []};
    
    let pose = await posenetEntity.estimateSinglePose(imageTensor, {
        'flipHorizontal': false
    });
    
    imageTensor.dispose();
    
    let pointSize = 5;

    for (const [key, value] of Object.entries(pose.keypoints)) {
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
        let distance = findDistance(results.position[1].leftEye, results.position[2].rightEye);

        results.distance.push(distance);
    }
    
    return results;
};

const findDistance = (p, q) => {
    let dx = p.x - q.x;
    let dy = p.y - q.y;
    
    return Math.sqrt(dx * dx + dy * dy);
};
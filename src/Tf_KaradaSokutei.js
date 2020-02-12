"use strict";

/* global */

const tensorFlow = require("@tensorflow/tfjs-node");
const poseNet = require("@tensorflow-models/posenet");
const {createCanvas, Image} = require("canvas");

const urlRoot = "../public";

let resolution = {'width': 640, 'height': 480};

let posenetEntity = null;

let canvas = null;
let canvasContext = null;

let response = {
    'messages': {
        'success': "",
        'error': ""
    }
};

exports.startup = async() => {
    posenetEntity = await poseNet.load({
        'architecture': "ResNet50",
        'outputStride': 32,
        'inputResolution': resolution,
        'quantBytes': 2
    });

    canvas = createCanvas(resolution.width, resolution.height);
    canvasContext = canvas.getContext("2d");
};

exports.execute = async(request, callback) => {
    if (request.params.event === undefined && request.query.event === undefined && request.body.event === undefined) {
        putImageInCanvas(`${urlRoot}/images/karada_sokutei/source.png`);
        
        let elements = await findPoseElement();
        
        if (elements !== null) {
            response.canvasDataUrl = canvas.toDataURL("image/jpeg");

            response.elements = JSON.stringify(elements);
        }
    }
    
    callback(response);
};

const putImageInCanvas = (path) => {
    let image = new Image();
    
    image.onload = () => {
        canvasContext.drawImage(image, 0, 0);
    };
    
    image.src = path;
};

const findPoseElement = async() => {
    let results = {'position': [], 'distance': []};
    
    let imageTensor = tensorFlow.browser.fromPixels(canvas);
    
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
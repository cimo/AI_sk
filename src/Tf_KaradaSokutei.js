"use strict";

/* global */

const tf = require("@tensorflow/tfjs-node");
const posenet = require("@tensorflow-models/posenet");
const {createCanvas, Image} = require("canvas");

exports.run = function(callback) {
    console.log("TensorFlowJs running...");
    
    let sitePath = "../public";
    
    let imageScaleFactor = 0.50;
    let flipHorizontal = false;
    let outputStride = 16;
    
    let pointSize = 5;
    
    let response = {};
    
    let execute = async() => {
        console.log("TensorFlowJs started.");
        
        let net = await posenet.load({
            'architecture': "MobileNetV1",
            'outputStride': 16,
            'inputResolution': 513,
            'multiplier': 0.75
        });
        
        let image = new Image();
        image.src = `${sitePath}/images/test.png`;
        
        let canvas = createCanvas(image.width, image.height);
        let ctx = canvas.getContext("2d");
        
        ctx.drawImage(image, 0, 0);
        
        let input = tf.browser.fromPixels(canvas);
        let pose = await net.estimateSinglePose(input, imageScaleFactor, flipHorizontal, outputStride);
        
        let elements = {'position': [], 'distance': []};
        
        for (let value of pose.keypoints) {
            elements.position.push({
                [value.part]: {
                    'x': value.position.x,
                    'y': value.position.y
                }
            });
            
            ctx.fillStyle = "blue";
            ctx.fillRect(value.position.x - (pointSize / 2), value.position.y - (pointSize / 2), pointSize, pointSize);
        }
        
        let distance = findDistance(elements.position[1].leftEye, elements.position[2].rightEye);
        
        elements.distance.push(distance);
        
        response = {
            'canvasDataUrl': canvas.toDataURL(),
            'elements': elements
        };
        
        callback(response);
        
        console.log("TensorFlowJs ended.");
    };
    
    execute();
};

function findDistance(p, q) {
    let dx = p.x - q.x;
    let dy = p.y - q.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist;
}
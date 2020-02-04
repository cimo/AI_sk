"use strict";

/* global */

const tf = require("@tensorflow/tfjs-node");
const posenet = require("@tensorflow-models/posenet");
const {createCanvas, Image} = require("canvas");

exports.run = function(callback) {
    console.log("Tf_KaradaSokutei running...");
    
    let sitePath = "../public";
    
    let pointSize = 5;
    
    let response = {};
    
    const execute = async() => {
        console.log("Job started.");
        
        let net = await posenet.load({
            'architecture': "ResNet50",
            'outputStride': 32,
            'inputResolution': 640,
            'quantBytes': 2
        });
        
        let image = new Image();
        
        image.src = `${sitePath}/images/test.png`;
        
        let canvas = createCanvas(image.width, image.height);
        let ctx = canvas.getContext("2d");
        
        ctx.drawImage(image, 0, 0);
        
        let input = tf.browser.fromPixels(canvas);
        let pose = await net.estimateSinglePose(input, {
            'flipHorizontal': false
        });
        
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
        
        console.log("Job ended.");
    };
    
    execute();
};

function findDistance(p, q) {
    let dx = p.x - q.x;
    let dy = p.y - q.y;
    
    return Math.sqrt(dx * dx + dy * dy);
}
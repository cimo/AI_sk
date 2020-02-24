"use strict";

/* global __dirname, Uint8Array, Buffer */

const fs = require("fs");
const {Canvas, Image} = require("canvas");
const tensorFlow = require("@tensorflow/tfjs-node");
const mobileNet = require("@tensorflow-models/mobilenet");
const knnClassifier = require("@tensorflow-models/knn-classifier");

const helper = require("./Helper");

const urlRoot = "../public";

let mobileNetEntity = null;
let knnClassifierEntity = null;

let response = {
    'messages': {},
    'values': {},
    'ajax': false
};

exports.startup = async() => {
    mobileNetEntity = await mobileNet.load();
    
    knnClassifierEntity = knnClassifier.create();
    
    await readBrain();
};

exports.socketEvent = async(socket) => {
    socket.on("predictionFromCamera", async(base64) => {
        let prediction = await predictionFromCamera(base64);
        
        if (prediction !== null)
            socket.emit("prediction_label", prediction.label);
    });
    
    socket.on("learnFromCamera", async(json) => {
        await learnFromCamera(json);
        
        await writeBrain();
    });
};

exports.execute = async(request, callback) => {
    if (request.params.event === undefined && request.query.event === undefined && request.body.event === undefined) {
        //...
    }
    else if (request.body.event === "learnFromFile") {
        await learnFromFile();
        
        await writeBrain();
        
        response.ajax = true;
    }
    
    callback(response);
    
    response = {
        'messages': {},
        'values': {},
        'ajax': false
    };
};

const readBrain = async() => {
    try {
        let dataset = JSON.parse(fs.readFileSync(`${urlRoot}/files/brain.json`));
        let datasetResult = {};
        
        for (const [key, value] of Object.entries(dataset)) {
            datasetResult[key] = tensorFlow.tensor(value, [value.length / 1024, 1024]);
        }
        
        knnClassifierEntity.setClassifierDataset(datasetResult);
        
        helper.writeLog("Read brain completed.");
    }
    catch (error) {
        helper.writeLog(`Read brain error -> ${error}`);
        
        await writeBrain();
        
        await readBrain();
    }
};

const writeBrain = () => {
    let datasets = knnClassifierEntity.getClassifierDataset();
    let datasetResult = {};
    
    for (const [key, value] of Object.entries(datasets)) {
        datasetResult[key] = Array.from(value.dataSync());
    }
    
    fs.writeFileSync(`${urlRoot}/files/brain.json`, JSON.stringify(datasetResult));
    
    helper.writeLog("Write brain completed.");
};

const learnFromFile = () => {
    let elements = {};
    
    elements.linux = readImageFile(`${urlRoot}/images/classifier/linux.jpg`);
    elements.windows = readImageFile(`${urlRoot}/images/classifier/windows.jpg`);
    
    for (const [key, value] of Object.entries(elements)) {
        createClass("file", value, key);
        createClass("file", value, key);
        createClass("file", value, key);
    }
    
    response.messages.success = "Learn from file completed.";
    
    helper.writeLog("Learn from file completed.");
};

const learnFromCamera = async(json) => {
    if (json !== undefined) {
        let imageCanvas = await createImageCanvas(json.base64);

        createClass("canvas", imageCanvas, json.label);
        createClass("canvas", imageCanvas, json.label);
        createClass("canvas", imageCanvas, json.label);

        response.messages.success = "Learn from camera completed.";
        
        helper.writeLog("Learn from camera completed.");
    }
    else
        helper.writeLog("Learn from camera error!");
};

const predictionFromCamera = async(base64) => {
    let prediction = null;
    
    if (base64 !== undefined && knnClassifierEntity !== null && knnClassifierEntity.getNumClasses() > 0) {
        let imageCanvas = await createImageCanvas(base64);
        
        let imageTensor = tensorFlow.browser.fromPixels(imageCanvas);
        
        let classification = mobileNetEntity.infer(imageTensor, "conv_preds");
        
        imageTensor.dispose();
        
        prediction = knnClassifierEntity.predictClass(classification);
    }
    
    return prediction;
};

const createImageCanvas = async(buffer) => {
    let image = null;
    
    const imageLoadPromise = new Promise(resolve => {
        image = new Image();
        image.onload = resolve;
        image.src = buffer;
    });
    
    await imageLoadPromise;
    
    let canvas = new Canvas(image.width, image.height);
    let canvasContext = canvas.getContext("2d");
    
    canvasContext.drawImage(image, 0, 0);
    
    return canvas;
};

const readImageFile = (path) => {
    let data = fs.readFileSync(path);
    let arrayByte = Uint8Array.from(Buffer.from(data));
    
    return arrayByte;
};

const createClass = (type, image, label) => {
    let imageTensor = null;
    
    if (type === "file")
        imageTensor = tensorFlow.node.decodeJpeg(image);
    else if (type === "canvas")
        imageTensor = tensorFlow.browser.fromPixels(image);
    
    let classification = mobileNetEntity.infer(imageTensor, "conv_preds");
    
    imageTensor.dispose();
    
    if (label !== undefined)
        knnClassifierEntity.addExample(classification, label);
};
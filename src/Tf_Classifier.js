"use strict";

/* global __dirname, Uint8Array */

const fs = require("fs");
const tensorFlow = require("@tensorflow/tfjs-node");
const mobileNet = require("@tensorflow-models/mobilenet");
const knnClassifier = require("@tensorflow-models/knn-classifier");

const urlRoot = "../public";

let imageSource = "base64.jpg";

let mobileNetEntity = null;
let knnClassifierEntity = null;

let response = {
    'messages': {
        'success': "",
        'error': ""
    }
};

exports.startup = async() => {
    mobileNetEntity = await mobileNet.load();
    
    knnClassifierEntity = knnClassifier.create();
    
    await readBrain();
};

exports.socketEvent = async(socket) => {
    socket.on("predictionFromCamera", async(dataUrl) => {
        let prediction = await predictionFromCamera(dataUrl);
        
        if (prediction !== null)
            socket.emit("prediction_label", prediction.label);
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
    else if (request.body.event === "learnFromCamera") {
        await learnFromCamera(request.body);
        
        await writeBrain();
        
        response.ajax = true;
    }
    
    callback(response);
};

const readBrain = async() => {
    try {
        let dataset = JSON.parse(fs.readFileSync(`${urlRoot}/files/brain.json`));
        let datasetResult = {};
        
        for (const [key, value] of Object.entries(dataset)) {
            datasetResult[key] = tensorFlow.tensor(value, [value.length / 1024, 1024]);
        }
        
        knnClassifierEntity.setClassifierDataset(datasetResult);
        
        console.log("Read brain completed.");
    }
    catch (error) {
        console.log(`Read brain error -> ${error}`);
        
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
    
    console.log("Write brain completed.");
};

const learnFromFile = () => {
    let elements = {};
    
    elements.linux = readImageFile(`${urlRoot}/images/classifier/linux.jpg`);
    elements.windows = readImageFile(`${urlRoot}/images/classifier/windows.jpg`);
    
    for (const [key, value] of Object.entries(elements)) {
        createClass(value, key);
        createClass(value, key);
        createClass(value, key);
    }
    
    response.messages.success = "Learn from file completed.";
    
    console.log("Learn from file completed.");
};

const learnFromCamera = (requestBody) => {
    let image = readImageFile(`${urlRoot}/images/classifier/${imageSource}`);
    
    createClass(image, requestBody.label);
    createClass(image, requestBody.label);
    createClass(image, requestBody.label);
    
    response.messages.success = "Learn from camera completed.";
    
    console.log("Learn from camera completed.");
};

const predictionFromCamera = (dataUrl) => {
    let prediction = null;
    
    if (dataUrl !== undefined && knnClassifierEntity !== null) {
        if (knnClassifierEntity.getNumClasses() > 0) {
            let buffer = dataUrl.buffer.replace("data:image/jpeg;base64,", "");

            fs.writeFileSync(`${urlRoot}/images/classifier/${imageSource}`, buffer, "base64", (error) => {});

            let source = readImageFile(`${urlRoot}/images/classifier/${imageSource}`);

            let imageTensor = tensorFlow.node.decodeJpeg(source);
            //let imageTensor = tensorFlow.browser.fromPixels(source);

            let classification = mobileNetEntity.infer(imageTensor, "conv_preds");

            imageTensor.dispose();

            prediction = knnClassifierEntity.predictClass(classification);
        }
    }
    
    return prediction;
};

const readImageFile = (path) => {
    let data = fs.readFileSync(path);
    let arrayByte = Uint8Array.from(Buffer.from(data));
    
    return arrayByte;
};

const createClass = (image, label) => {
    let imageTensor = tensorFlow.node.decodeJpeg(image);
    
    let classification = mobileNetEntity.infer(imageTensor, "conv_preds");
    
    imageTensor.dispose();
    
    if (label !== undefined)
        knnClassifierEntity.addExample(classification, label);
    
    return classification;
};
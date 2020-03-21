"use strict";

/* global __dirname, Uint8Array, Buffer */

const fs = require("fs");
const path = require("path");
const {Canvas, Image} = require("canvas");
const JsZip = require("jszip");
const tensorFlow = require("@tensorflow/tfjs-node");
const mobileNet = require("@tensorflow-models/mobilenet");
const knnClassifier = require("@tensorflow-models/knn-classifier");

const helper = require("./Helper");

const urlRoot = `${path.dirname(__dirname)}/public`;

let mobileNetEntity = null;
let knnClassifierEntity = null;

let socketTag = "ri_";

let response = {
    'messages': {},
    'values': {},
    'ajax': false
};

exports.startup = async() => {
    mobileNetEntity = await mobileNet.load();
    
    knnClassifierEntity = knnClassifier.create();
    
    await _readBrain();
};

exports.socketEvent = async(socketIo, socket) => {
    socket.on(`${socketTag}predictionFromCamera`, async(data) => {
        let prediction = await _predictionFromCamera(data);
        
        if (prediction !== null)
            socket.emit(`${socketTag}prediction`, prediction);
    });
    
    socket.on(`${socketTag}learnFromCamera`, async(data) => {
        await _learnFromCamera(data);
    });
};

exports.execute = async(request, callback) => {
    if (request.params.event === undefined && request.query.event === undefined && request.body.event === undefined) {
        //...
    }
    else if (request.body.event === "learnFromFile") {
        _learnFromFile();
        
        response.ajax = true;
    }
    
    callback(response);
    
    response = {
        'messages': {},
        'values': {},
        'ajax': false
    };
};

const _readBrain = async() => {
    try {
        let dataset = JSON.parse(fs.readFileSync(`${urlRoot}/files/recognition_image/brain.json`));
        let datasetResult = {};
        
        for (const [key, value] of Object.entries(dataset)) {
            datasetResult[key] = tensorFlow.tensor(value, [value.length / 1024, 1024]);
        }
        
        knnClassifierEntity.setClassifierDataset(datasetResult);
        
        helper.writeLog("Read brain completed.");
    }
    catch (error) {
        await _writeBrain();
        
        await _readBrain();
    }
};

const _writeBrain = () => {
    let datasets = knnClassifierEntity.getClassifierDataset();
    let datasetResult = {};
    
    for (const [key, value] of Object.entries(datasets)) {
        datasetResult[key] = Array.from(value.dataSync());
    }
    
    fs.writeFileSync(`${urlRoot}/files/recognition_image/brain.json`, JSON.stringify(datasetResult));
    
    helper.writeLog("Write brain completed.");
};

const _predictionFromCamera = async(base64) => {
    let prediction = null;

    if (base64 !== undefined && knnClassifierEntity !== null && knnClassifierEntity.getNumClasses() > 0) {
        let imageCanvas = await _createImageCanvas(base64);

        let classification = _createClassification("canvas", imageCanvas);

        prediction = knnClassifierEntity.predictClass(classification);
    }

    return prediction;
};

const _createImageCanvas = async(buffer) => {
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

const _learnFromCamera = async(json) => {
    if (json !== undefined) {
        let imageCanvas = await _createImageCanvas(json.base64);

        _createClassification("canvas", imageCanvas, json.label);
        _createClassification("canvas", imageCanvas, json.label);
        _createClassification("canvas", imageCanvas, json.label);

        _writeBrain();
        
        helper.writeLog("Learn from camera completed.");
    }
    else
        helper.writeLog("Learn from camera error!");
};

const _learnFromFile = () => {
    let data = fs.readFileSync(`${urlRoot}/files/recognition_image/learn.zip`);

    if (data !== false) {
        let zip = new JsZip();

        zip.loadAsync(data).then((contents) => {
            for (const [key, value] of Object.entries(contents.files)) {
                if (value.dir === false) {
                    let hiddenFile = value.name.substring(0, 2);

                    if (hiddenFile !== "__") {
                        zip.file(value.name).async("nodebuffer").then((buffer) => {
                            _createClassification("file", buffer, key);
                            _createClassification("file", buffer, key);
                            _createClassification("file", buffer, key);

                            _writeBrain();
                        });
                    }
                }
            }
        });

        response.messages.success = "Learn from file completed.";

        helper.writeLog("Learn from file completed.");
    }
    else {
        response.messages.error = "Learn from file not completed!";

        helper.writeLog("Learn from file not completed!");
    }
};

const _createClassification = (type, image, label) => {
    let imageTensor = null;
    
    if (type === "file")
        imageTensor = tensorFlow.node.decodeJpeg(image);
    else if (type === "canvas")
        imageTensor = tensorFlow.browser.fromPixels(image);
    
    let classification = mobileNetEntity.infer(imageTensor, "conv_preds");
    
    imageTensor.dispose();
    
    if (label !== undefined)
        knnClassifierEntity.addExample(classification, label);

    return classification;
};

const _readImageFile = (path) => {
    let data = fs.readFileSync(path);
    let arrayByte = Uint8Array.from(Buffer.from(data));
    
    return arrayByte;
};
var tf = require("@tensorflow/tfjs-node");
var posenet = require("@tensorflow-models/posenet");
var {createCanvas, Image} = require("canvas");

exports.run = function(callback) {
    console.log("Tensorflow running...");
    
    var sitePath = "../public_html";
    
    var imageScaleFactor = 0.50;
    var flipHorizontal = false;
    var outputStride = 16;
    
    var pointSize = 5;
    
    var response = {};
    
    var execute = async() => {
        console.log("Tensorflow started.");
        
        var net = await posenet.load({
            'architecture': "MobileNetV1",
            'outputStride': 16,
            'inputResolution': 513,
            'multiplier': 0.75
        });
        
        var image = new Image();
        image.src = sitePath + "/images/test.png";
        
        var canvas = createCanvas(image.width, image.height);
        var ctx = canvas.getContext("2d");
        
        ctx.drawImage(image, 0, 0);
        
        var input = tf.browser.fromPixels(canvas);
        var pose = await net.estimateSinglePose(input, imageScaleFactor, flipHorizontal, outputStride);
        
        var elements = {'position': [], 'distance': []};
        
        for (var value of pose.keypoints) {
            elements.position.push({
                [value.part]: {
                    'x': value.position.x,
                    'y': value.position.y
                }
            });
            
            ctx.fillStyle = "blue";
            ctx.fillRect(value.position.x - (pointSize / 2), value.position.y - (pointSize / 2), pointSize, pointSize);
        }
        
        elements.distance.push(distance(elements.position[1].leftEye, elements.position[2].rightEye));
        
        response = {
            'canvasDataUrl': canvas.toDataURL(),
            'elements': elements
        };
        
        callback(response);
        
        console.log("Tensorflow ended.");
    };
    
    execute();
};

function distance(p, q) {
    var dx = p.x - q.x;
    var dy = p.y - q.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist;
}
"use strict";

/* global */

const karadaSokutei = new KaradaSokutei();

function KaradaSokutei() {
    // Vars
    const self = this;
    
    let dpi;
    
    let elements;

    let distance;
    
    // Properties
    
    // Functions public
    self.init = function() {
        dpi = 0;
        
        elements = {};
        
        distance = 0;
    };
    
    self.createImage = function() {
        let canvas = $("#canvas")[0];
        let ctx = canvas.getContext("2d");

        let sizeW = 640;
        let sizeH = 480;

        let image = new Image();
        
        image.onload = function() {
            let scale = Math.min((sizeW / image.width), (sizeH / image.height));

            let width = image.width * scale;
            let height = image.height * scale;

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(image, 0, 0, width, height);
        };
        
        image.src = window.canvasDataUrl;
    };
    
    self.findDistance = function(message) {
        dpi = screenDpi();

        elements = JSON.parse(window.elements);

        distance = (elements.distance / dpi) * 2.54;

        $("#distance").find("li").eq(0).html(`${message} ${distance.toFixed(2)} cm.`);
    };
    
    // Functions private
    function screenDpi() {
        let element = document.createElement("div");
        element.style = "width: 1in;";

        document.body.appendChild(element);

        let dpi = element.offsetWidth;

        document.body.removeChild(element);

        return dpi;
    }
}
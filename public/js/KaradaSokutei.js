"use strict";

/* global */

class KaradaSokutei {
    // Properties
    
    // Functions public
    constructor() {
        this.canvasDataUrl = window.canvasDataUrl;
        this.elements = JSON.parse(window.elements);
        
        this.dpi = 0;
        
        this.distance = 0;
    }
    
    createImageFromCanvas = () => {
        $("#result").attr("src", this.canvasDataUrl);
    }
    
    showPosition = () => {
        $.each(this.elements.position, (key, value) => {
            $.each(value, (keySub, valueSub) => {
                $("#position").append(`<li>${keySub} - ${JSON.stringify(valueSub)}</li>`);
            });
        }); 
    }
    
    showDistance = (message) => {
        this.dpi = this.screenDpi();
        
        this.distance = (this.elements.distance / this.dpi) * 2.54;

        $("#distance").append(`<li>${message} ${this.distance.toFixed(2)} cm.</li>`);
    }
    
    // Functions private
    screenDpi = () => {
        let element = document.createElement("div");
        element.style = "width: 1in;";

        document.body.appendChild(element);

        let result = element.offsetWidth;

        document.body.removeChild(element);

        return result;
    }
}

$(document).ready(() => {
    let karadaSokutei = new KaradaSokutei();
    
    karadaSokutei.createImageFromCanvas();
    karadaSokutei.showPosition();
    karadaSokutei.showDistance("Distance from leftEye to rightEye are: ");
});
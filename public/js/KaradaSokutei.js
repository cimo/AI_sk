/* global */

var karadaSokutei = new KaradaSokutei();

function KaradaSokutei() {
    // Vars
    var self = this;
    
    var dpi;
    
    var elements;

    var distance;
    
    // Properties
    
    // Functions public
    self.init = function() {
        dpi = 0;

        elements = {};

        distance = 0;
    };
    
    self.createImage = function() {
        var canvas = $("#canvas")[0];
        var ctx = canvas.getContext("2d");

        var sizeW = 710;
        var sizeH = 528;

        var image = new Image();
        image.onload = function() {
            var scale = Math.min((sizeW / image.width), (sizeH / image.height));

            var width = image.width * scale;
            var height = image.height * scale;

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

        $("#distance").find("li").eq(0).html(message + distance.toFixed(2) + " cm.");
    };
    
    // Functions private
    function screenDpi() {
        var element = document.createElement('div');
        element.style = "width: 1in;";

        document.body.appendChild(element);

        var dpi = element.offsetWidth;

        document.body.removeChild(element);

        return dpi;
    }
}
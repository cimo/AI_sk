"use strict";

/* global */

class KaradaSokutei {
    // Properties
    
    // Functions public
    constructor() {
    }
    
    eventLogic = () => {
        $("#find_point").on("click", "", (event) => {
            $.ajax({
                'url': window.location.href,
                'method': "post",
                'data': {
                    'event': "findPoint"
                },
                'dataType': "json",
                'cache': false,
                'processData': true,
                'contentType': "application/x-www-form-urlencoded; charset=UTF-8",
                beforeSend: () => {
                },
                success: (xhr) => {
                    $("#info").html("");
                    
                    if (xhr.response.messages.error !== undefined)
                        $("#info").html(xhr.response.messages.error);
                    else if (xhr.response.values.canvasDataUrl !== undefined) {
                        this.createImageFromCanvas(xhr.response);
                        this.showPosition(xhr.response);
                        this.showDistance(xhr.response, "Distance from leftEye to rightEye are: ");
                    }
                },
                error: (xhr, status) => {
                    console.log(xhr, status);
                },
                complete: () => {
                }
            });
        });
    }
    
    // Functions private
    createImageFromCanvas = (response) => {
        $("#image").html("");
        
        $("#image").attr("src", response.values.canvasDataUrl);
    }
    
    showPosition = (response) => {
        $("#position").html("");
        
        let elements = JSON.parse(response.values.elements);
        
        $.each(elements.position, (key, value) => {
            $.each(value, (keySub, valueSub) => {
                $("#position").append(`<li>${keySub} - ${JSON.stringify(valueSub)}</li>`);
            });
        }); 
    }
    
    showDistance = (response, message) => {
        let elements = JSON.parse(response.values.elements);
        
        let dpi = this.screenDpi();
        
        let distance = (elements.distance / dpi) * 2.54;
        
        $("#distance").html("");
        $("#distance").append(`<li>${message} ${distance.toFixed(2)} cm.</li>`);
    }
    
    screenDpi = () => {
        let element = $("<div></div>");
        element.css("width", "1in");
        
        $("body").append(element);
        
        let result = element.outerWidth();
        
        element.remove();
        
        return result;
    }
}

$(document).ready(() => {
    let karadaSokutei = new KaradaSokutei();
    
    karadaSokutei.eventLogic();
});
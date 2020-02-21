"use strict";

/* global */

class Classifier {
    // Properties
    
    // Functions public
    constructor(websocket) {
        this.websocket = websocket;
        
        this.camera = new Camera();
    }
    
    comunication = () => {
        this.websocket.messageFromServer("#prediction .label", "prediction_label", () => {
            //...
        });
        
        this.camera.setIsMobile = false;
        this.camera.canvasSetting(320, 180);
        this.camera.createVideo();
        this.camera.eventLogic();
        
        this.camera.captureCallback(() => {
            let base64 = this.camera.getCanvas[0].toDataURL("image/jpeg");
            
            this.websocket.sendImage("predictionFromCamera", base64);
        });
    }
    
    eventLogic = () => {
        $("#command_container").find(".learn_file_button").on("click", "", (event) => {
            $.ajax({
                'url': window.location.href,
                'method': "post",
                'data': {
                    'event': "learnFromFile"
                },
                'dataType': "json",
                'cache': false,
                'processData': true,
                'contentType': "application/x-www-form-urlencoded; charset=UTF-8",
                beforeSend: () => {
                },
                success: (xhr) => {
                    console.log(xhr.response);
                },
                error: (xhr, status) => {
                    console.log(xhr.response, status);
                },
                complete: () => {
                }
            });
        });
        
        $("#command_container").find(".learn_camera_button").on("click", "", (event) => {
            let label = $("#command_container").find(".learn_camera_label").val();
            let base64 = this.camera.getCanvas[0].toDataURL("image/jpeg");
            
            if (label !== "" && base64 !== "") {
                $.ajax({
                    'url': window.location.href,
                    'method': "post",
                    'data': {
                        'event': "learnFromCamera",
                        'label': label,
                        'base64': base64
                    },
                    'dataType': "json",
                    'cache': false,
                    'processData': true,
                    'contentType': "application/x-www-form-urlencoded; charset=UTF-8",
                    beforeSend: () => {
                    },
                    success: (xhr) => {
                        console.log(xhr.response);
                    },
                    error: (xhr, status) => {
                        console.log(xhr.response, status);
                    },
                    complete: () => {
                    }
                });
            }
        });
    }
    
    // Functions private
}
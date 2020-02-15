"use strict";

/* global */

class Classifier {
    // Properties
    
    // Functions public
    constructor(websocket) {
        this.websocket = websocket;
        
        this.camera = new Camera();
    }
    
    comunication = (address) => {
        this.websocket.getSocketIo.connect(address);
        
        this.websocket.messageFromServer("prediction_label", "#prediction .label", () => {
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
                    console.log(xhr);
                },
                error: (xhr, status) => {
                    console.log(xhr, status);
                },
                complete: () => {
                }
            });
        });
        
        $("#command_container").find(".learn_camera_button").on("click", "", (event) => {
            let learLabel = $("#command_container").find(".learn_camera_label").val();
            
            if (learLabel !== "") {
                $.ajax({
                    'url': window.location.href,
                    'method': "post",
                    'data': {
                        'event': "learnFromCamera",
                        'label': learLabel
                    },
                    'dataType': "json",
                    'cache': false,
                    'processData': true,
                    'contentType': "application/x-www-form-urlencoded; charset=UTF-8",
                    beforeSend: () => {
                    },
                    success: (xhr) => {
                        console.log(xhr);
                    },
                    error: (xhr, status) => {
                        console.log(xhr, status);
                    },
                    complete: () => {
                    }
                });
            }
        });
    }
    
    // Functions private
}
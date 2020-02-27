"use strict";

/* global */

class RecognitionImage {
    // Properties
    
    // Functions public
    constructor(websocket) {
        this.websocket = websocket;
        
        this.camera = new Camera();
    }
    
    communication = () => {
        this.websocket.messageFromServer("#prediction .label", "predictionLabel", () => {
            //...
        });
        
        this.camera.setIsMobile = false;
        this.camera.setting(320, 180);
        this.camera.createVideo();
        this.camera.eventLogic();
        
        this.camera.captureVideoCallback(() => {
            let base64 = this.camera.getCanvas[0].toDataURL("image/jpeg");
            
            this.websocket.sendMessage("predictionFromCamera", base64);
        });
    }
    
    eventLogic = () => {
        $("#command_container").find(".start_capture").on("click", "", (event) => {
            this.camera.startCaptureVideo();
        });
        
        $("#command_container").find(".stop_capture").on("click", "", (event) => {
            this.camera.stopCaptureVideo();
        });
        
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
            
            if (label !== "" && base64 !== "")
                this.websocket.sendMessage("learnFromCamera", {'label': label, 'base64': base64});
        });
    }
    
    // Functions private
}
"use strict";

/* global */

class RecognitionImage {
    // Properties
    
    // Functions public
    constructor(socketIo) {
        this.socketIo = socketIo;
        this.socketTag = "ri_";

        this.camera = new Camera();
        this.camera.setIsMobile = false;
        this.camera.setting(3, 1280, 720);
        this.camera.createVideo();
        this.camera.eventLogic();
    }
    
    eventLogic = () => {
        this.camera.captureVideoCallback(() => {
            let base64 = this.camera.getCanvas[0].toDataURL("image/jpeg");

            this.socketIo.emit(`${this.socketTag}predictionFromCamera`, base64);
        });

        this.socketIo.on(`${this.socketTag}prediction`, (data) => {
            this._showPrediction(data);
        });

        $("#command_container").find(".learn_camera_button").on("click", "", (event) => {
            let label = $("#command_container").find(".learn_camera_label").val();
            let base64 = this.camera.getCanvas[0].toDataURL("image/jpeg");

            if (label !== "" && base64 !== "")
                this.socketIo.emit(`${this.socketTag}learnFromCamera`, {'label': label, 'base64': base64});
        });

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
                    'event': "learnFromFile",
                    '_csrf': $("meta[name='csrf-token']").attr("content")
                },
                'dataType': "json",
                'cache': false,
                'processData': true,
                'contentType': "application/x-www-form-urlencoded; charset=UTF-8",
                beforeSend: () => {
                },
                success: (xhr) => {
                    if (xhr.response.messages.success !== undefined)
                        this._showInfo(xhr.response.messages.success);
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
    _showInfo = (messasge) => {
        $("#info").html(messasge);
    }

    _showPrediction = (response) => {
        $("#prediction .label").html(response.label);
    }
}
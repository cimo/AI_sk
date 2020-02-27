"use strict";

/* global */

class RecognitionSound {
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
        this.camera.setting();
        this.camera.createAudio();
        this.camera.eventLogic();
        
        this.camera.captureAudioCallback(() => {
            //...
        });
    }
    
    eventLogic = () => {
        $("#command_container").find(".start_capture").on("click", "", (event) => {
            this.camera.startCaptureAudio();
        });
        
        $("#command_container").find(".stop_capture").on("click", "", (event) => {
            this.camera.stopCaptureAudio();
        });
    }
    
    // Functions private
}
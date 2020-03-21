"use strict";

/* global */

class RecognitionSound {
    // Properties
    
    // Functions public
    constructor(socketIo) {
        this.socketIo = socketIo;
        this.socketTag = "rs_";
        
        this.camera = new Camera();
    }
    
    communication = () => {
        this.socketIo.on(`${this.socketTag}prediction`, (data) => {
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
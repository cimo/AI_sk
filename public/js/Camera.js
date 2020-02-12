"use strict";

/* global */

class Camera {
    // Properties
    get getCanvas() {
        return this.canvas;
    }
    
    set setIsMobile(value) {
        this.isMobile = value;
    }
    
    // Functions public
    constructor() {
        this.cameraContainer = null;
        this.canvas = null;
        this.canvasContext = null;
        this.video = null;
        this.source = null;
        this.sourceSelectedIndex = -1;
        this.reset = null;
        
        this.intervalEvent = null;
        this.timeoutEvent = null;
        
        this.isMobile = false;
        this.isRegenerate = true;
        
        this.captureTime = 1000 / 3;
        this.captureEvent = null;
    }
    
    canvasSetting = (width, height) => {
        this.cameraContainer = $("#video_container").find(".camera");
        this.canvas = $("#video_container").find(".camera canvas");
        this.video = $("#video_container").find(".camera video");
        this.source = $("#video_container").find(".source");
        this.reset = $("#video_container").find(".reset");
        
        if (this.cameraContainer !== undefined) {
            this.cameraContainer.width(width);
            this.cameraContainer.height(height);
        }
        
        if (this.canvas[0] !== undefined) {
            this.canvas.width(width);
            this.canvas.height(height);
            
            this.canvasContext = this.canvas[0].getContext("2d");
        }
        
        if (this.video !== undefined) {
            this.video.width(width);
            this.video.height(height);
        }
    }
    
    createVideo = () => {
        if (this.canvas[0] !== undefined) {
            if (window.stream !== undefined)
                window.stream.getVideoTracks()[0].stop();
            
            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices().then((devices) => {
                    this.deviceEvent(devices);
                }).catch((error) => {
                    this.errorEvent(error);
                });
            }
            else {
                let mode = navigator.getUserMedia() || navigator.webkitGetUserMedia() || navigator.mozGetUserMedia();
                
                mode({'video': true, 'audio': false}).then((stream) => {
                    this.successEvent(stream);
                }).catch((error) => {
                    this.errorEvent(error);
                });
            }
        }
    }
    
    captureCallback = (callback) => {
        if (callback !== undefined)
            this.captureEvent = callback;
    }
    
    resize = () => {
        let width = $("#video_container").width();
        let height = width / 2.031;
        
        if (this.cameraContainer !== undefined) {
            this.cameraContainer.width(width);
            this.cameraContainer.height(height);
        }
        
        if (this.canvas[0] !== undefined) {
            this.canvas.width(width);
            this.canvas.height(height);
            
            this.canvasContext = this.canvas[0].getContext("2d");
        }
        
        if (this.video !== undefined) {
            this.video.width(width);
            this.video.height(height);
        }
    }
    
    eventLogic = () => {
        this.source.on("change", "", (event) => {
            this.sourceSelectedIndex = $(event.target).prop("selectedIndex");
            
            clearInterval(this.intervalEvent);
            
            this.createVideo();
        });
        
        this.reset.on("click", "", (event) => {
            this.isRegenerate = true;
            
            clearInterval(this.intervalEvent);
            
            this.createVideo();
        });
    }
    
    // Functions private
    deviceEvent = (devices) => {
        let videoOption = {};
        
        let videoCount = 0;
        
        if (this.video !== undefined) {
            if (this.isRegenerate === true)
                this.source.find("option:gt(0)").remove();
            
            $.each(devices, (key, value) => {
                if (value.kind === "videoinput") {
                    videoCount ++;
                    
                    let label = value.label === "" ? `Video ${videoCount}` : value.label;
                    
                    if (this.sourceSelectedIndex <= 1) {
                        if (this.isMobile === false)
                            videoOption = {'deviceId': {'exact': value.deviceId}};
                        else
                            videoOption = {'facingMode': "user"};
                    }
                    else
                        videoOption = {'facingMode': "environment"};
                    
                    if (this.isRegenerate === true)
                        this.source.append(`<option value="${value.deviceId}">${label}</option>`);
                }
            });
            
            if (this.isMobile === true && this.sourceSelectedIndex === -1)
                videoOption = {'facingMode': "environment"};
            
            let constraints = {'video': videoOption, 'audio': false};
            
            navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                this.successEvent(stream);
            }).catch((error) => {
                this.errorEvent(error);
            });
        }
        
        this.isRegenerate = false;
    }
    
    successEvent = (event) => {
        window.stream = event;
        
        if (this.video !== undefined) {
            this.video[0].srcObject = event;
            this.video[0].play();
            
            this.intervalEvent = setInterval(this.capture, this.captureTime);
        }
    }
    
    capture = () => {
        if (this.video !== undefined && this.canvas[0] !== undefined)
            this.canvasContext.drawImage(this.video[0], 0, 0, this.canvas[0].width, this.canvas[0].height);
        
        try {
            if (this.captureEvent !== null)
                this.captureEvent();
        }
        catch(error) {
            this.errorEvent(error);
            
            this.timeoutEvent = setTimeout(this.capture, this.captureTime);
            
            clearTimeout(this.timeoutEvent);
        }
    }
    
    errorEvent = (event) => {
        //console.log(`errorEvent: ${event}`);
    }
}
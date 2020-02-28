"use strict";

/* global URL */

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
        this.userMedia = {};
        this.stream = null;
        
        this.cameraContainer = null;
        this.canvas = null;
        this.canvasContext = null;
        
        this.video = null;
        this.sourceVideo = null;
        this.isVideo = false;
        
        this.intervalVideoEvent = null;
        this.timeoutVideoEvent = null;
        
        this.captureVideoTime = 1000 / 3;
        this.captureVideoEvent = null;
        
        this.audio = null;
        this.sourceAudio = null;
        this.isAudio = false;
        this.audioChunk = [];
        
        this.timeoutAudioEvent = null;
        
        this.captureAudioTime = 1000 / 3;
        this.captureAudioEvent = null;
        
        this.recorder = null;
        
        this.reset = null;
        
        this.isMobile = false;
        
        this.isRegenerate = false;
    }
    
    setting = (width, height) => {
        this.cameraContainer = $("#camera_container").find(".camera");
        this.canvas = $("#camera_container").find(".camera canvas");
        
        this.video = $("#camera_container").find(".camera video");
        this.sourceVideo = $("#camera_container").find(".source_video");
        
        this.audio = $("#camera_container").find(".camera audio");
        this.sourceAudio = $("#camera_container").find(".source_audio");
        
        this.reset = $("#camera_container").find(".reset");
        
        if (width !== undefined && height !== undefined) {
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
    }
    
    createVideo = () => {
        if (this.video[0] !== undefined) {
            this.isVideo = true;
            
            this.resetVideo();
            
            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices().then((devices) => {
                    this.deviceEvent(devices);
                }).catch((error) => {
                    this.errorEvent(error);
                });
            }
            else {
                let mode = navigator.getUserMedia() || navigator.webkitGetUserMedia() || navigator.mozGetUserMedia() || navigator.msGetUserMedia;
                
                mode({'video': true, 'audio': false}).then((stream) => {
                    this.successEvent(stream);
                }).catch((error) => {
                    this.errorEvent(error);
                });
            }
        }
        else
            this.isVideo = false;
    }
    
    createAudio = () => {
        if (this.audio[0] !== undefined) {
            this.isAudio = true;
            
            this.resetAudio();
            
            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices().then((devices) => {
                    this.deviceEvent(devices);
                }).catch((error) => {
                    this.errorEvent(error);
                });
            }
            else {
                let mode = navigator.getUserMedia() || navigator.webkitGetUserMedia() || navigator.mozGetUserMedia() || navigator.msGetUserMedia;
                
                mode({'video': false, 'audio': true}).then((stream) => {
                    this.successEvent(stream);
                }).catch((error) => {
                    this.errorEvent(error);
                });
            }
        }
        else
            this.isAudio = false;
    }
    
    resize = () => {
        let width = $("#camera_container").width();
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
        this.reset.on("click", "", (event) => {
            this.isRegenerate = true;
            
            if (this.isVideo === true) {
                this.sourceVideo.val(0);
                
                this.createVideo();
            }
            
            if (this.isAudio === true) {
                this.sourceAudio.val(0);
                
                this.createAudio();
            }
        });
    }
    
    startCaptureVideo = () => {
        if (this.sourceVideo.val() !== "0") {
            this.resetVideo();

            navigator.mediaDevices.getUserMedia(this.userMedia).then((stream) => {
                this.successEvent(stream);
            }).catch((error) => {
                this.errorEvent(error);
            });
        }
    }
    
    stopCaptureVideo = () => {
        this.resetVideo();
    }
    
    captureVideoCallback = (callback) => {
        if (callback !== undefined)
            this.captureVideoEvent = callback;
    }
    
    startCaptureAudio = () => {
        if (this.sourceAudio.val() !== "0") {
            this.resetAudio();

            navigator.mediaDevices.getUserMedia(this.userMedia).then((stream) => {
                this.successEvent(stream);
            }).catch((error) => {
                this.errorEvent(error);
            });
        }
    }
    
    stopCaptureAudio = () => {
        this.resetAudio();
    }
    
    captureAudioCallback = (callback) => {
        if (callback !== undefined)
            this.captureAudioEvent = callback;
    }
    
    // Functions private
    deviceEvent = (devices) => {
        let videoOptions = false;
        let audioOptions = false;
        
        let videoCount = 0;
        let audioCount = 0;
        
        if (this.isRegenerate === true) {
            this.sourceVideo.find("option:gt(0)").remove();
            
            this.sourceAudio.find("option:gt(0)").remove();
        }
        
        $.each(devices, (key, value) => {
            if (this.isVideo === true && value.kind === "videoinput") {
                videoCount ++;
                
                let label = value.label === "" ? `Video ${videoCount}` : value.label;
                
                let facingMode = {'facingMode': "environment"};
                
                if (this.isMobile === true)
                    facingMode = {'facingMode': "user"};
                
                videoOptions = {'deviceId': {'exact': value.deviceId}, facingMode};
                
                this.sourceVideo.append(`<option value="${value.deviceId}">${label}</option>`);
            }
            
            if (this.isAudio === true && value.kind === "audioinput") {
                audioCount ++;
                
                let label = value.label === "" ? `Audio ${audioCount}` : value.label;
                
                audioOptions = {'deviceId': {'exact': value.deviceId}};
                
                this.sourceAudio.append(`<option value="${value.deviceId}">${label}</option>`);
            }
        });
        
        this.userMedia = {'video': videoOptions, 'audio': audioOptions};
        
        this.isRegenerate = false;
    }
    
    successEvent = (stream) => {
        this.stream = stream;
        
        if (this.isVideo === true) {
            this.video[0].srcObject = stream;
            this.video[0].controls = false;
            this.video[0].autoplay = true;
            
            this.intervalVideoEvent = setInterval(this.captureVideo, this.captureVideoTime);
        }
        
        if (this.isAudio === true) {
            this.recorder = new MediaRecorder(stream);
            
            this.recorder.ondataavailable = event => {
                this.audioChunk.push(event.data);
                
                if (this.recorder.state === "inactive") {
                    let blob = new Blob(this.audioChunk, {'type': "audio/mpeg-3"});
                    
                    this.audio[0].src = URL.createObjectURL(blob);
                    this.audio[0].controls = true;
                    this.audio[0].autoplay = true;
                }
            };
            
            this.captureAudio();
        }
    }
    
    captureVideo = () => {
        try {
            this.canvasContext.drawImage(this.video[0], 0, 0, this.canvas[0].width, this.canvas[0].height);
            
            if (this.captureVideoEvent !== null)
                this.captureVideoEvent();
        }
        catch(error) {
            this.errorEvent(error);
            
            this.timeoutVideoEvent = setTimeout(this.captureVideo, this.captureVideoTime);
            
            clearTimeout(this.timeoutVideoEvent);
        }
    }
    
    captureAudio = () => {
        try {
            this.recorder.start();
            
            if (this.captureAudioEvent !== null)
                this.captureAudioEvent();
        }
        catch(error) {
            this.errorEvent(error);
            
            this.timeoutAudioEvent = setTimeout(this.captureAudio, this.captureAudioTime);
            
            clearTimeout(this.timeoutAudioEvent);
        }
    }
    
    resetVideo = () => {
        if (this.stream !== null)
            this.stream.getVideoTracks()[0].stop();
        
        clearInterval(this.intervalVideoEvent);
    }
    
    resetAudio = () => {
        if (this.stream !== null)
            this.stream.getAudioTracks()[0].stop();
        
        if (this.recorder !== null && this.recorder.state !== "inactive") {
            this.audioChunk = [];
            
            this.recorder.stop();
        }
    }
    
    errorEvent = (event) => {
        //console.log(`errorEvent: ${event}`);
    }
}
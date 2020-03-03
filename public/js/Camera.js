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
        this.userMedia = {};
        this.stream = null;

        this.cameraContainer = null;

        this.sourceContainer = null;

        this.canvas = null;
        this.canvasContext = null;
        
        this.video = null;
        this.videoOptions = {};
        this.sourceVideo = null;
        this.isVideo = false;
        
        this.intervalVideoEvent = null;
        this.timeoutVideoEvent = null;
        
        this.captureVideoTime = 1000 / 3;
        this.captureVideoEvent = null;
        
        this.audio = null;
        this.audioOptions = {};
        this.sourceAudio = null;
        this.isAudio = false;
        this.audioChunk = [];

        this.timeoutAudioEvent = null;
        
        this.captureAudioTime = 1000 / 3;
        this.captureAudioEvent = null;

        this.resetButton = null;

        this.recorder = null;

        this.isReset = false;
        this.isMobile = false;
    }
    
    setting = (width, height) => {
        this.cameraContainer = $("#camera_container");

        this.sourceContainer = $(this.cameraContainer).find(".source_container");

        this.canvas = $(this.cameraContainer).find(".camera canvas");
        
        this.video = $(this.cameraContainer).find(".camera video");
        this.sourceVideo = $(this.cameraContainer).find(".source_video");
        
        this.audio = $(this.cameraContainer).find(".camera audio");
        this.sourceAudio = $(this.cameraContainer).find(".source_audio");
        
        this.resetButton = $(this.cameraContainer).find(".reset");
        
        if (width !== undefined && height !== undefined) {
            if (this.sourceContainer !== undefined) {
                this.sourceContainer.width(width);
                this.sourceContainer.height(height);
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
            
            this._resetVideo();

            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices().then((devices) => {
                    this._deviceEvent(devices);
                }).catch((error) => {
                    this._errorEvent(error);
                });
            }
            else {
                let mode = navigator.getUserMedia() || navigator.webkitGetUserMedia() || navigator.mozGetUserMedia() || navigator.msGetUserMedia;

                mode({'video': true, 'audio': false}).then((stream) => {
                    this._successEvent(stream);
                }).catch((error) => {
                    this._errorEvent(error);
                });
            }
        }
        else
            this.isVideo = false;
    }
    
    createAudio = () => {
        if (this.audio[0] !== undefined) {
            this.isAudio = true;
            
            this._resetAudio();

            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices().then((devices) => {
                    this._deviceEvent(devices);
                }).catch((error) => {
                    this._errorEvent(error);
                });
            }
            else {
                let mode = navigator.getUserMedia() || navigator.webkitGetUserMedia() || navigator.mozGetUserMedia() || navigator.msGetUserMedia;

                mode({'video': false, 'audio': true}).then((stream) => {
                    this._successEvent(stream);
                }).catch((error) => {
                    this._errorEvent(error);
                });
            }
        }
        else
            this.isAudio = false;
    }
    
    resize = () => {
        let width = $(this.cameraContainer).width();
        let height = width / 2.031;
        
        if (this.sourceContainer !== undefined) {
            this.sourceContainer.width(width);
            this.sourceContainer.height(height);
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
        this.sourceVideo.on("change", "", (event) => {
            let index = $(event.target).val();

            if (this.isMobile === true)
                this.videoOptions[`video_${index}`].facingMode = {'facingMode': "user"};

            this.userMedia = {'video': this.videoOptions[`video_${index}`], 'audio': this.audioOptions['audio_1']};
        });

        this.sourceAudio.on("change", "", (event) => {
            let index = $(event.target).val();

            this.userMedia = {'video': this.videoOptions['video_1'], 'audio': this.audioOptions[`audio_${index}`]};
        });

        this.resetButton.on("click", "", (event) => {
            this.isReset = true;

            if (this.isVideo === true) {
                $(this.video).hide();

                this.sourceVideo.val(0);

                this.createVideo();
            }

            if (this.isAudio === true) {
                $(this.audio).hide();

                this.sourceAudio.val(0);

                this.createAudio();
            }
        });
    }
    
    startCaptureVideo = () => {
        if (this.sourceVideo.val() !== "0") {
            this._resetVideo();

            $(this.video).show();

            navigator.mediaDevices.getUserMedia(this.userMedia).then((stream) => {
                this._successEvent(stream);
            }).catch((error) => {
                this._errorEvent(error);
            });
        }
    }
    
    stopCaptureVideo = () => {
        this._resetVideo();

        $(this.video).hide();
    }
    
    captureVideoCallback = (callback) => {
        if (callback !== undefined)
            this.captureVideoEvent = callback;
    }
    
    startCaptureAudio = () => {
        if (this.sourceAudio.val() !== "0") {
            this._resetAudio();

            $(this.audio).hide();

            navigator.mediaDevices.getUserMedia(this.userMedia).then((stream) => {
                this._successEvent(stream);
            }).catch((error) => {
                this._errorEvent(error);
            });
        }
    }
    
    stopCaptureAudio = () => {
        this._resetAudio();

        $(this.audio).hide();
    }
    
    captureAudioCallback = (callback) => {
        if (callback !== undefined)
            this.captureAudioEvent = callback;
    }
    
    // Functions private
    _deviceEvent = (devices) => {
        this.videoOptions = {
            'video_0': false
        };
        let videoCount = 0;

        this.audioOptions = {
            'audio_0': false
        };
        let audioCount = 0;
        
        if (this.isReset === true) {
            this.sourceVideo.find("option:gt(0)").remove();
            
            this.sourceAudio.find("option:gt(0)").remove();
        }

        $.each(devices, (key, value) => {
            if (this.isVideo === true && value.kind === "videoinput") {
                videoCount ++;

                let label = value.label === "" ? `Video ${videoCount}` : value.label;
                
                let facingMode = {'facingMode': "environment"};

                this.videoOptions[`video_${videoCount}`] = {'deviceId': {'exact': value.deviceId}, facingMode};
                
                this.sourceVideo.append(`<option value="${videoCount}">${label}</option>`);
            }
            
            if (this.isAudio === true && value.kind === "audioinput") {
                audioCount ++;

                let label = value.label === "" ? `Audio ${audioCount}` : value.label;

                this.audioOptions[`audio_${audioCount}`] = {'deviceId': {'exact': value.deviceId}};
                
                this.sourceAudio.append(`<option value="${audioCount}">${label}</option>`);
            }
        });

        this.userMedia = {'video': this.videoOptions['video_1'], 'audio': this.audioOptions['audio_1']};
        
        this.isReset = false;
    }
    
    _successEvent = (stream) => {
        this.stream = stream;
        
        if (this.isVideo === true) {
            this.video[0].srcObject = stream;
            this.video[0].controls = false;
            this.video[0].autoplay = true;

            this.intervalVideoEvent = setInterval(this._captureVideo, this.captureVideoTime);
        }
        
        if (this.isAudio === true) {
            this.recorder = new MediaRecorder(stream);
            
            this.recorder.ondataavailable = event => {
                this.audioChunk.push(event.data);
                
                if (this.recorder.state === "inactive") {
                    let blob = new Blob(this.audioChunk, {'type': "audio/mpeg-3"});
                    
                    this.audio[0].src = window.URL.createObjectURL(blob);
                    this.audio[0].controls = true;
                    this.audio[0].autoplay = true;
                }
            };
            
            this._captureAudio();
        }
    }
    
    _captureVideo = () => {
        try {
            this.canvasContext.drawImage(this.video[0], 0, 0, this.canvas[0].width, this.canvas[0].height);
            
            if (this.captureVideoEvent !== null)
                this.captureVideoEvent();
        }
        catch(error) {
            this._errorEvent(error);
            
            this.timeoutVideoEvent = setTimeout(this._captureVideo, this.captureVideoTime);
            
            clearTimeout(this.timeoutVideoEvent);
        }
    }
    
    _captureAudio = () => {
        try {
            this.recorder.start();
            
            if (this.captureAudioEvent !== null)
                this.captureAudioEvent();
        }
        catch(error) {
            this._errorEvent(error);
            
            this.timeoutAudioEvent = setTimeout(this._captureAudio, this.captureAudioTime);
            
            clearTimeout(this.timeoutAudioEvent);
        }
    }
    
    _resetVideo = () => {
        if (this.stream !== null) {
            this.stream.getVideoTracks()[0].stop();

            this.video[0].pause();
            this.video[0].currentTime = 0;
        }
        
        clearInterval(this.intervalVideoEvent);
    }
    
    _resetAudio = () => {
        if (this.stream !== null) {
            this.stream.getAudioTracks()[0].stop();

            this.audio[0].pause();
            this.audio[0].currentTime = 0;
        }
        
        if (this.recorder !== null && this.recorder.state !== "inactive") {
            this.audioChunk = [];
            
            this.recorder.stop();
        }
    }
    
    _errorEvent = (event) => {
        //console.log(`errorEvent: ${event}`);
    }
}
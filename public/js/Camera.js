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
        this.cameraContainerTag = "";

        this.sourceContainer = null;
        this.canvas = null;
        this.canvasContext = null;
        this.resetButton = null;

        this.video = null;
        this.videoOptions = {};
        this.videoSource = null;
        this.isVideo = false;

        this.intervalVideoEvent = null;
        this.captureVideoTime = 1000 / 3;
        this.captureVideoEvent = null;

        this.audio = null;
        this.audioOptions = {};
        this.audioSource = null;
        this.isAudio = false;

        this.stream = null;
        this.recorder = null;
        this.audioChunk = [];

        this.captureAudioEvent = null;

        this.userMediaElements = {};

        this.isReset = false;
        this.isMobile = false;
    }
    
    setting = (width, height) => {
        this.cameraContainerTag = "#camera_container";

        this.sourceContainer = $(this.cameraContainerTag).find(".source_container");
        this.canvas = $(this.cameraContainerTag).find("canvas");
        this.resetButton = $(this.cameraContainerTag).find(".reset");
        
        this.video = $(this.cameraContainerTag).find("video");
        this.videoSource = $(this.cameraContainerTag).find(".video_source");
        
        this.audio = $(this.cameraContainerTag).find("audio");
        this.audioSource = $(this.cameraContainerTag).find(".audio_source");

        if (width !== undefined && height !== undefined) {
            if (this.sourceContainer !== undefined) {
                $(this.sourceContainer).width(width);
                $(this.sourceContainer).height(height);
            }

            if (this.canvas !== undefined) {
                $(this.canvas).width(width);
                $(this.canvas).height(height);

                this.canvasContext = this.canvas[0].getContext("2d");
            }

            if (this.video !== undefined) {
                $(this.video).width(width);
                $(this.video).height(height);
            }
        }
    }
    
    createVideo = () => {
        if (this.video !== undefined) {
            this.isVideo = true;
            
            this._resetVideo();

            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices().then((devices) => {
                    this._deviceEvent(devices);
                }).catch((error) => {
                    this._errorEvent(error);
                });
            }
        }
        else
            this.isVideo = false;
    }
    
    createAudio = () => {
        if (this.audio !== undefined) {
            this.isAudio = true;
            
            this._resetAudio();

            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices().then((devices) => {
                    this._deviceEvent(devices);
                }).catch((error) => {
                    this._errorEvent(error);
                });
            }
        }
        else
            this.isAudio = false;
    }
    
    resize = () => {
        let width = $(this.cameraContainerTag).width();
        let height = width / 2.031;
        
        if (this.sourceContainer !== undefined) {
            $(this.sourceContainer).width(width);
            $(this.sourceContainer).height(height);
        }
        
        if (this.canvas !== undefined) {
            $(this.canvas).width(width);
            $(this.canvas).height(height);
            
            this.canvasContext = this.canvas[0].getContext("2d");
        }
        
        if (this.video !== undefined) {
            $(this.video).width(width);
            $(this.video).height(height);
        }
    }
    
    eventLogic = () => {
        $(this.videoSource).on("change", "", (event) => {
            let index = $(event.target).val();

            if (this.isMobile === true)
                this.videoOptions[`video_${index}`].facingMode = {'facingMode': "user"};

            this.userMediaElements = {'video': this.videoOptions[`video_${index}`], 'audio': this.audioOptions['audio_1']};
        });

        $(this.audioSource).on("change", "", (event) => {
            let index = $(event.target).val();

            this.userMediaElements = {'video': this.videoOptions['video_1'], 'audio': this.audioOptions[`audio_${index}`]};
        });

        $(this.resetButton).on("click", "", (event) => {
            this.isReset = true;

            if (this.isVideo === true) {
                $(this.video).hide();

                $(this.videoSource).val(0);

                this.createVideo();
            }

            if (this.isAudio === true) {
                $(this.audio).hide();

                $(this.audioSource).val(0);

                this.createAudio();
            }
        });
    }
    
    startCaptureVideo = () => {
        if ($(this.videoSource).val() !== "0") {
            this._resetVideo();

            $(this.video).show();

            navigator.mediaDevices.getUserMedia(this.userMediaElements).then((stream) => {
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
        if ($(this.audioSource).val() !== "0") {
            this._resetAudio();

            $(this.audio).hide();

            navigator.mediaDevices.getUserMedia(this.userMediaElements).then((stream) => {
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
            $(this.videoSource).find("option:gt(0)").remove();

            $(this.audioSource).find("option:gt(0)").remove();
        }

        $.each(devices, (key, value) => {
            if (this.isVideo === true && value.kind === "videoinput") {
                videoCount ++;

                let label = value.label === "" ? `Video ${videoCount}` : value.label;
                
                let facingMode = {'facingMode': "environment"};

                this.videoOptions[`video_${videoCount}`] = {'deviceId': {'exact': value.deviceId}, facingMode};

                $(this.videoSource).append(`<option value="${videoCount}">${label}</option>`);
            }
            
            if (this.isAudio === true && value.kind === "audioinput") {
                audioCount ++;

                let label = value.label === "" ? `Audio ${audioCount}` : value.label;

                this.audioOptions[`audio_${audioCount}`] = {'deviceId': {'exact': value.deviceId}};

                $(this.audioSource).append(`<option value="${audioCount}">${label}</option>`);
            }
        });

        this.userMediaElements = {'video': this.videoOptions['video_1'], 'audio': this.audioOptions['audio_1']};
        
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
        if (this.video[0] !== null) {
            this.canvasContext.drawImage(this.video[0], 0, 0, this.canvas[0].width, this.canvas[0].height);

            if (this.captureVideoEvent !== null)
                this.captureVideoEvent();
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
    
    _captureAudio = () => {
        if (this.recorder !== null) {
            this.recorder.start();

            if (this.captureAudioEvent !== null)
                this.captureAudioEvent();
        }
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
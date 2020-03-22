"use strict";

/* global */

class RecognitionPose {
    // Properties
    
    // Functions public
    constructor(socketIo) {
        this.socketIo = socketIo;
        this.socketTag = "rp_";

        this.poseNet = null;
        this.resolution = {'width': 640, 'height': 480};

        this.camera = new Camera();
        this.camera.setIsMobile = false;
        this.camera.setting(60, this.resolution.width, this.resolution.height);
        this.camera.createVideo();
        this.camera.eventLogic();

        this.image = null;

        this.requestAnimationFrameLoop = false;
        this.requestAnimationFrameId = null;
    }

    eventLogic = () => {
        this.camera.captureVideoCallback(async() => {
            let base64 = this.camera.getCanvas[0].toDataURL("image/jpeg");

            this.image = await this._createImage(base64);
        });

        this.socketIo.on(`${this.socketTag}prediction`, (data) => {
            this._showPosition(data);
            this._showDistance(data, "Distance from leftEye to rightEye are: ");
        });

        $("#command_container").find(".start_capture").on("click", "", async(event) => {
            if (this.requestAnimationFrameLoop === false) {
                this.camera.startCaptureVideo();

                await this._settingPoseNet("realtime");

                this._estimatePose();
            }
        });

        $("#command_container").find(".stop_capture").on("click", "", (event) => {
            this.camera.stopCaptureVideo();

            this.requestAnimationFrameLoop = false;
        });

        $("#command_container").find(".find_point_image").on("click", "", async(event) => {
            if (this.requestAnimationFrameLoop === false) {
                this.camera.stopCaptureVideo();

                this.image = await this._createImage("/files/recognition_pose/source.png");

                this.camera.getCanvasContext.clearRect(0, 0, this.camera.getCanvas[0].width, this.camera.getCanvas[0].height);
                this.camera.getCanvasContext.drawImage(this.image, 0, 0, this.image.width, this.image.height);

                await this._settingPoseNet("image");

                this._estimatePose();

                this.requestAnimationFrameLoop = false;
            }
        });
    }
    
    // Functions private
    _settingPoseNet = async(type) => {
        this.poseNet = null;

        if (type === "realtime")
            this.poseNet = await posenet.load();
        else if (type === "image") {
            this.poseNet = await posenet.load({
                'architecture': "MobileNetV1",
                'outputStride': 16,
                'inputResolution': this.resolution,
                'multiplier': 0.75
            });
        }

        this.requestAnimationFrameLoop = true;
    }

    _estimatePose = async() => {
        if (this.poseNet !== null && this.image !== null) {
            let results = {'values': {'elements': {'position': [], 'distance': []}}};

            const poses = await this.poseNet.estimateSinglePose(this.image, {
                'flipHorizontal': false
            });

            let pointSize = 5;

            for (const [key, value] of Object.entries(poses.keypoints)) {
                results.values.elements.position.push({
                    [value.part]: {
                        'x': value.position.x,
                        'y': value.position.y
                    }
                });

                this.camera.getCanvasContext.fillStyle = "blue";
                this.camera.getCanvasContext.fillRect(value.position.x - (pointSize / 2), value.position.y - (pointSize / 2), pointSize, pointSize);
            }

            if (results.values.elements.position.length > 0) {
                let distance = this._findDistance(results.values.elements.position[1].leftEye, results.values.elements.position[2].rightEye);

                results.values.elements.distance.push(distance);
            }

            this.socketIo.emit(`${this.socketTag}estimatePose`, results);
        }

        if (this.requestAnimationFrameLoop === true)
            this.requestAnimationFrameId = requestAnimationFrame(this._estimatePose);
        else
            cancelAnimationFrame(this.requestAnimationFrameId);
    }

    _findDistance = (p, q) => {
        let dx = p.x - q.x;
        let dy = p.y - q.y;

        return Math.sqrt(dx * dx + dy * dy);
    };

    _createImage = async(buffer) => {
        let image = null;

        const imageLoadPromise = new Promise(resolve => {
            image = new Image();
            image.onload = resolve;
            image.src = buffer;
        });

        await imageLoadPromise;

        return image;
    }

    _showPosition = (response) => {
        $("#prediction").find(".position").html("");
        
        let elements = response.values.elements;
        
        $.each(elements.position, (key, value) => {
            $.each(value, (keySub, valueSub) => {
                $("#prediction").find(".position").append(`<li>${keySub} - ${JSON.stringify(valueSub)}</li>`);
            });
        }); 
    }
    
    _showDistance = (response, message) => {
        $("#prediction").find(".distance").html("");

        let elements = response.values.elements;
        
        let dpi = this._screenDpi();
        
        let distance = (elements.distance / dpi) * 2.54;

        $("#prediction").find(".distance").append(`<li>${message} ${distance.toFixed(2)} cm.</li>`);
    }

    _screenDpi = () => {
        let element = $("<div></div>");
        element.css("width", "1in");
        
        $("body").append(element);
        
        let result = element.outerWidth();
        
        element.remove();
        
        return result;
    }
}
"use strict";

/* global */

class RecognitionPose {
    // Properties
    
    // Functions public
    constructor(socketIo) {
        this.socketIo = socketIo;
        this.socketTag = "rp_";

        this.posenet = null;

        this.camera = new Camera();
        this.camera.setIsMobile = false;
        this.camera.setting(60,640, 480);
        this.camera.createVideo();
        this.camera.eventLogic();

        this.image = null;
    }

    createRealtimePosition = async() => {
        this.posenet = await posenet.load();

        this._showRealtimePosition();
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

        $("#command_container").find(".start_capture").on("click", "", (event) => {
            this.camera.startCaptureVideo();
        });

        $("#command_container").find(".stop_capture").on("click", "", (event) => {
            this.camera.stopCaptureVideo();
        });

        $("#command_container").find(".find_point_image").on("click", "", (event) => {
            this.camera.stopCaptureVideo();

            $.ajax({
                'url': window.location.href,
                'method': "post",
                'data': {
                    'event': "predictionFromImage",
                    '_csrf': $("meta[name='csrf-token']").attr("content")
                },
                'dataType': "json",
                'cache': false,
                'processData': true,
                'contentType': "application/x-www-form-urlencoded; charset=UTF-8",
                beforeSend: () => {
                },
                success: (xhr) => {
                    $("#info").html("");
                    
                    if (xhr.response.messages.error !== undefined)
                        this._showInfo(xhr.response.messages.error);
                    else if (xhr.response.values.canvasDataUrl !== undefined) {
                        this._showImage(xhr.response);
                        this._showPosition(xhr.response);
                        this._showDistance(xhr.response, "Distance from leftEye to rightEye are: ");
                    }
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

    _showRealtimePosition = async() => {
        if (this.posenet !== null && this.image !== null) {
            let results = {'values': {'elements': {'position': [], 'distance': []}}};

            const poses = await this.posenet.estimateSinglePose(this.image, {
                'flipHorizontal': false
            });

            let pointSize = 10;

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

            this.socketIo.emit(`${this.socketTag}showRealtimePosition`, results);
        }

        requestAnimationFrame(this._showRealtimePosition);
    }

     _findDistance = (p, q) => {
        let dx = p.x - q.x;
        let dy = p.y - q.y;

        return Math.sqrt(dx * dx + dy * dy);
    };

    _showImage = (response) => {
        $("#prediction").find(".image").attr("src", response.values.canvasDataUrl);
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

    _screenDpi = () => {
        let element = $("<div></div>");
        element.css("width", "1in");
        
        $("body").append(element);
        
        let result = element.outerWidth();
        
        element.remove();
        
        return result;
    }
}
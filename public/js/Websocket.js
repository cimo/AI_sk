"use strict";

/* global */

class Websocket {
    // Properties
    get getSocketIo() {
        return this.socketIo;
    };
    
    // Functions public
    constructor() {
        this.socketIo = io();
    }
    
    messageFromBroadcast = (target, callback) => {
        this.socketIo.on("broadcast", (data) => {
            $(target).text(data);
            
            if (callback !== undefined)
                callback();
        });
    }
    
    messageFromServer = (label, target, callback) => {
        this.socketIo.on(label, (data) => {
            $(target).text(data);
            
            if (callback !== undefined)
                callback();
        });
    }
    
    sendMessage = (label, message, callback) => {
        this.socketIo.emit(label, message);
        
        if (callback !== undefined)
            callback();
    }
    
    sendImage = (label, buffer, callback) => {
        this.socketIo.emit(label, {'image': true, 'buffer': buffer});
        
        if (callback !== undefined)
            callback();
    }
    
    // Functions private
}
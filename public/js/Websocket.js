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
    
    messageFromServerBroadcast = (tag, callback) => {
        this.socketIo.on("broadcast", (data) => {
            $(tag).text(data);
            
            if (callback !== undefined)
                callback();
        });
    }
    
    messageFromServer = (tag, label, callback) => {
        this.socketIo.on(label, (data) => {
            $(tag).text(data);
            
            if (callback !== undefined)
                callback();
        });
    }
    
    sendMessage = (label, message, callback) => {
        this.socketIo.emit(label, message);
        
        if (callback !== undefined)
            callback();
    }
    
    // Functions private
}
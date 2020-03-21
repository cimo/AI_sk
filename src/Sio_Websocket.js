"use strict";

/* global */

// Send to connected client
//socket.emit("label", "message");

// Send to all connected clients
//socketIoServer.emit("label", "message");

// Send to all clients except sender
//socket.broadcast.emit("message");

const helper = require("./Helper");

let connectionCount = 0;

exports.startup = async(socketIoServer, socket) => {
    run(socketIoServer, socket);
};

const run = (socketIoServer, socket) => {
    let address = JSON.stringify(socket.handshake.address);
    
    helper.writeLog(`Connection from client: ${address}`);
    
    connectionCount ++;
    
    socketIoServer.emit("broadcast", `${connectionCount} clients connected.`);
    
    let intervalEvent = setInterval(() => {
        serverTime(socket);
    }, 1000);
    
    socket.emit("message", "Connected to server.");
    
    socket.on("disconnect", () => {
        helper.writeLog(`Disconnection from client: ${address}`);
        
        connectionCount --;
        
        socketIoServer.emit("broadcast", `${connectionCount} clients connected.`);
        
        if (connectionCount === 0)
            clearInterval(intervalEvent);
        
        socket.emit("message", "Disconnected from server.");
    });
};

const serverTime = (socket) => {
    let today = new Date();
    
    let fixHours = today.getHours() < 10 ? "0" : "";
    fixHours += today.getHours();
    
    let fixMinuts = today.getMinutes() < 10 ? "0" : "";
    fixMinuts += today.getMinutes();
    
    let fixSeconds = today.getSeconds() < 10 ? "0" : "";
    fixSeconds += today.getSeconds();
    
    let date = `${today.getFullYear()}/${(today.getMonth() + 1)}/${today.getDate()} ${fixHours}:${fixMinuts}:${fixSeconds}`;
    
    socket.emit("serverTime", date);
};
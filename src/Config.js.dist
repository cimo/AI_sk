"use strict";

/* global */

const digestEnable = false;

exports.settings = {
    'certificates': {
        'key': "/etc/certificate/Encrypted.key",
        'cert': "/etc/certificate/Encrypted.crt"
    },
    'digest': {
        'path': "/home/node/app",
        'enable': digestEnable
    }
};

exports.digestCheck = (digest, callback) => {
    let self = this;

    if (digestEnable === true) {
        return digest.check((req, res) => {
            callback.apply(self, [req, res]);
        });
    }
    else {
        return (req, res) => {
            callback.apply(self, [req, res]);
        };
    }
};
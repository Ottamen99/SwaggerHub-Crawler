const io = require('socket.io-client');
const socket = io.connect('http://localhost:3000'); // replace 3000 with the actual port of your Socket.IO server
const config = require('../config/config');

// increment number of elements in the queue
exports.increaseKafka = async () => {
    try {
        await new Promise((resolve) => {
            socket.emit('kafka queue', 'increase', () => {
                resolve();
            });
        })
    } catch (err) {
        console.log(err);
    }
}

exports.refreshPriorityKafka = async (p, a) => {
    let msg = {
        priority: p,
        action: a
    }
    try {
        await new Promise((resolve) => {
            socket.emit('kafka priority', msg, () => {
                resolve();
            });
        })
    } catch (err) {
        console.log(err);
    }
}


exports.increaseSuccessKafka = async () => {
    try {
        await new Promise((resolve) => {
            socket.emit('kafka download', 'success', () => {
                resolve();
            });
        })
    } catch (err) {
        console.log(err);
    }
}

exports.increaseUpdateKafka = async () => {
    try {
        await new Promise((resolve) => {
            socket.emit('kafka update', 'success', () => {
                resolve();
            });
        })
    } catch (err) {
        console.log(err);
    }
}

// decrement number of elements in the queue
exports.decreaseKafka = async () => {
    try {
        await new Promise((resolve) => {
            socket.emit('kafka queue', 'decrease', () => {
                resolve();
            });
        })
    } catch (err) {
        console.log(err);
    }
}

exports.decreaseSuccessKafka = () => {
    socket.emit('kafka download', 'failure');
}

// disconnect from the webserver
exports.disconnect = () => {
    socket.disconnect();
}


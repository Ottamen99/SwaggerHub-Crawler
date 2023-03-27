const io = require('socket.io-client');
const {UI_SOCKET_ADDRESS} = require("../config/constants");
const socket = io.connect(UI_SOCKET_ADDRESS, {reconnect: true});

exports.sendStats = async (stats) => {
    try {
        await new Promise((resolve) => {
            socket.emit('stats', stats, () => {
                resolve();
            });
        })
    } catch (err) {
        console.log(err);
    }
}

// disconnect from the webserver
exports.disconnect = () => {
    socket.disconnect();
}


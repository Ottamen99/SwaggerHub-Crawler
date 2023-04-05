exports.BASE_SWAGGER_PROXY_URL = "https://app.swaggerhub.com/apiproxy/specs?";

exports.LOW_PRIORITY_TIMEOUT = 5000;

exports.UI_SOCKET_ADDRESS = process.env.SOCKET_ADDRESS || 'http://localhost:3000';

exports.TOR_PROXY = process.env.TOR_PROXY || 'socks5://127.0.0.1:9050';
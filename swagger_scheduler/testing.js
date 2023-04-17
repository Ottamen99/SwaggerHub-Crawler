const { Client } = require('ssh2');
const { MongoClient } = require('mongodb');

const sshConfig = {
    host: '10.40.1.120',
    port: 22,
    username: 'ottavio-buonomo',
    password: '123456'
};

const tunnelConfig = {
    host: '127.0.0.1',
    port: 27017,
    dstHost: '10.40.1.120',
    dstPort: 27017
};

const sshClient = new Client();

sshClient.on('ready', () => {
    console.log('SSH client connected');

    sshClient.forwardOut(
        tunnelConfig.host,
        tunnelConfig.port,
        tunnelConfig.dstHost,
        tunnelConfig.dstPort,
        (err, stream) => {
            if (err) throw err;

            const mongoClient = new MongoClient(
                `mongodb://${tunnelConfig.host}:${tunnelConfig.port}`,
                { useNewUrlParser: true, useUnifiedTopology: true, directConnection: true }
            );

            mongoClient.connect().then(() => {
                console.log('Mongo client connected');
            }).catch((err) => {
                console.log('Error connecting to MongoDB', err);
            })
        }
    );
});

sshClient.connect(sshConfig);

// function generateQuery({ sort_by, order, spec, ...restParams } = {}) {
//     const baseUrl = "https://app.swaggerhub.com/apiproxy/specs?type=API&";
//     const paramArrays = { sort_by, order, spec, ...restParams };
//     const cartesianProduct = getCartesianProduct(paramArrays);
//     const queries = cartesianProduct.flatMap(params => {
//         return Array.from({ length: 101 }, (_, i) => {
//             const queryParams = new URLSearchParams({ ...params, page: i }).toString();
//             return `${baseUrl}${queryParams}`;
//         });
//     });
//     return queries;
// }
//
// function getCartesianProduct(paramArrays) {
//     const keys = Object.keys(paramArrays);
//     const values = keys.map(key => paramArrays[key]);
//     const result = values.reduce((acc, arr) => {
//         return acc.flatMap(x => arr.map(y => [...x, y]));
//     }, [[]]);
//     return result.map(arr => {
//         return arr.reduce((acc, val, i) => {
//             acc[keys[i]] = val;
//             return acc;
//         }, {});
//     });
// }



// const queries = generateQuery({
//     sort_by: ['CREATED', 'OWNER'],
//     order: ['ASC'],
//     spec: ['OPENAPI3.0', 'SWAGGER2.0'],
//     category: ['ANIMALS', 'ARTS'],
//     // additional parameters
// });
// queries.forEach(query => console.log(query));



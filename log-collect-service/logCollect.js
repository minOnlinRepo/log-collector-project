const express = require('express');
const path = require('path');
const logger = require('./logger');

const myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);
let port = myArgs[0] || 3000;

let app = express();

app.listen(port, () => {
    console.log("Server running on port " + port);
});

let fsR = require('./utils/myFsReverse');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger);

app.post('/getLog', (req, res) => {
    let playload = req.body;
    const absoulteFilePath = path.resolve(path.normalize(playload.filePath));

    if ( !absoulteFilePath.startsWith('/var/log/') ) {
        res.write('The specified file must be under the directory "/var/log/"');
        res.status(500).end();
        return;
     }

    const fileName = absoulteFilePath;
    const lastEventNum = playload.lastEventNum;
    const searchText = playload.searchText;

    console.log("--- /getLog request------" + fileName + ",  " + lastEventNum + ", " + searchText);

    let readStream;
    try {
        readStream = fsR(fileName, {'searchText':searchText, 'maxLineCount':lastEventNum});
    } catch (error) {
       return res.status(500).send(error);
    }

    let lineNum = 0;
    let sentOut = false;
    readStream.on('data', (line) => {
        res.write(line + '\n');
        ++lineNum;
    })
        .on('end', (err) => {
            if (err) {
                res.write('error reading from file: ' + err.toString());
                res.status(500).end();
            }
            else {
                if (!sentOut) {
                    sentOut = true;
                    console.log('total event #' + lineNum);
                    res.status(200).end();
                }
            }
        });
});

module.exports = app;
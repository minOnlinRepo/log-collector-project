const myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);
let port = myArgs[0] || 3000;

let express = require('express');
let path = require('path');

let app = express();

app.listen(port, () => {
    console.log("Server running on port " + port);
});

let fsR = require('./utils/myFsReverse');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/getLog", (req, res, next) => {
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
        readStream = fsR(fileName, {});
  
    } catch (error) {
       return next(error);
    }

    let lineNum = 0;
    let sentOut = false;
    readStream.on('data', (line) => {
        if (line) { // have this check to make sure empty lines are not parsed
            if (!searchText || line.includes(searchText)) {

                if (lineNum == lastEventNum) {
                    readStream.emit('end');
                } else {
                    ++lineNum;
                    res.write(line + '\n');
                }

            }
        }
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
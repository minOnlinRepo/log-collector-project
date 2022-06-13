const myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);
let port = myArgs[0] || 3000;

let express = require('express');
let app = express();

app.listen(port, () => {
    console.log("Server running on port " + port);
});

let fsR = require('fs-reverse');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/getLog", (req, res, next) => {
    let playload = req.body;
    const fileName = playload.filePath;
    const lastEventNum = playload.lastEventNum;
    const searchText = playload.searchText;

    console.log("--- /getLog request------" + fileName + ",  " + lastEventNum + ", " + searchText);

    const readStream = fsR(fileName, {});
    let lineNum = 0;
    let lines = [];
    let sentOut = false;
    readStream.on('data', (line) => {
        if (line) { // have this check to make sure empty lines are not parsed
            if (!searchText || line.includes(searchText)) {

                if (lineNum == lastEventNum) {
                    readStream.emit('end');
                } else {
                    console.log(lineNum + ', ' + line);
                    ++lineNum;
                    lines.push(line);
                }

            }
        }
    })
        .on('end', function handleEndOfFileData(err) {
            if (err) {
                res.status(500).send({ "error reading from file": err.toString() });
            }
            else {
                if (!sentOut) {
                    sentOut = true;
                    res.status(200).send(lines);
                }
            }
        });
});

module.exports = app;
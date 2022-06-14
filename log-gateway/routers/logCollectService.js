let express = require('express');
let router = express.Router();
let path = require('path');
const apiService = require('./apiService');
//const isAuthorized = require('../auth/requestAuthenticator');



router.post('/getLog',/* isAuthorized,*/(req, res) => {
  let playload = req.body;
  let serverName = playload.serverName;
  const absoulteFilePath = path.resolve(path.normalize(playload.logFilePath));

  if ( !absoulteFilePath.startsWith('/var/log/') ) {
    res.status(500).send('The specified file must be under the directory "/var/log/"');
    return;
  }

  const postLoad = {
    filePath: absoulteFilePath,
    lastEventNum: playload.lastEventNum,
    searchText: playload.searchText
  };

  console.log(serverName + ', ' + JSON.stringify(postLoad));

  const BASE_URL = 'http://' + serverName;
  const api = apiService(BASE_URL);

  api.post(req.path, postLoad, { responseType: 'stream' }).then(response => {
    const stream = response.data;
    stream.on('data', (line) => {
      res.write(line);
    });
    stream.on('end', () => {
      res.status(200).end();
    });
  });
});
module.exports = router;
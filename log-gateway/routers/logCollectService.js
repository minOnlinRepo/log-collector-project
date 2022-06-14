let express = require('express');
let router = express.Router();
const apiService = require('./apiService');
//const isAuthorized = require('../auth/requestAuthenticator');



router.post('/getLog',/* isAuthorized,*/(req, res) => {
  let playload = req.body;
  let serverName = playload.serverName;

  if ( !playload.logFilePath.startsWith('/var/log/') ) {
    res.status(500).send('The specified file must be under the directory "/var/log/"');
    return;
  }

  const postLoad = {
    filePath: playload.logFilePath,
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
    stream.on('end', (err) => {
      if (err) {
          res.write('Error: ' + err.toString());
          res.status(500).end();
      } else {
        res.status(200).end();
      }
    });
  });
});
module.exports = router;
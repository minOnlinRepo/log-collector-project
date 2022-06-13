let express = require('express');
let router = express.Router();
const apiService = require('./apiService');
//const isAuthorized = require('../auth/requestAuthenticator');



router.post('/getLog',/* isAuthorized,*/(req, res) => {
  let playload = req.body;
  let serverName = playload.serverName;
  const postLoad = {
    filePath: playload.logFilePath,
    lastEventNum: playload.lastEventNum,
    searchText: playload.searchText
  };

  console.log(serverName + ', ' + JSON.stringify(postLoad));

  const BASE_URL = 'http://' + serverName;
  const api = apiService(BASE_URL);

  api.post(req.path, postLoad).then(resp => {
    res.send(resp.data)
  });
});

module.exports = router;
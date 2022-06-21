let express = require('express');
let router = express.Router();
let logCollectRouter = require('./logCollectService');
const logger = require('./logger');
const authRouter = require('./authorize');

router.use([logger, authRouter]);

router.use('/api/logCollect', logCollectRouter);

module.exports = router;
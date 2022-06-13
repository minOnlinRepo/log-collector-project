let express = require('express');
let router = express.Router()
let logCollectRouter = require('./logCollectService')
//let authRouter = require('../auth/AuthController')

router.use((req, res, next) => {
    console.log("Called: ", req.path)
    next()
})

router.use(logCollectRouter)
//router.use(authRouter)

module.exports = router
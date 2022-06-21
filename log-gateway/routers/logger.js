const logger = (req, res, next) => {
    const method = req.method;
    const ur = req.url;
    const time = new Date();
    console.log(method, ur, time);
    next();
  };

module.exports = logger;
  
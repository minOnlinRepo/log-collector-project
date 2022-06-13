let express = require('express');
let path = require('path');
let router = require('./routers/router');
let app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.use(router);

console.log("Simple API Gateway run on localhost:8080");

app.listen(8080);
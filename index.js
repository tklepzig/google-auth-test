const express = require("express");
const http = require("http");

const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.send("Pong");
});

httpServer.listen(port, () => {
    console.log(`listening on *:${port}`);
});

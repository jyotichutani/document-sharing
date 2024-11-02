const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

const documentRouter = require("./routes/document");

app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1:27017/documentSharing", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use("/documents", documentRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

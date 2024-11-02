const mongoose = require("mongoose");
const { Schema } = mongoose;

const documentSchema = new Schema({
    name: { type: String, required: true },
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "private",
    },
});

module.exports = mongoose.model("Document", documentSchema);

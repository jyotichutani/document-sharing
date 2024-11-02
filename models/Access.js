const mongoose = require("mongoose");
const { Schema } = mongoose;

const accessSchema = new Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accessType: { type: String, enum: ["read", "write", "owner"], required: true },
});

module.exports = mongoose.model("Access", accessSchema);

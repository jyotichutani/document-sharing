const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const User = require("../models/User");
const Access = require("../models/Access");

async function checkAccess(req, res, next) {
    const userEmail = req.body.userEmail;
    const documentId = req.params.documentId;
    const operation = req.operation;
    try {
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).send("Document not found.");
        }
        if (document.visibility === "public" && operation === "view") {
            return next();
        }
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).send("User not found.");
        }
        const access = await Access.findOne({
            user: user._id,
            document: documentId,
        });
        if (!access) {
            return res.status(403).send("Access denied: No access record.");
        }
        switch (operation) {
            case "view":
                if (["read", "write", "owner"].includes(access.accessType)) {
                    return next();
                }
                break;
            case "edit":
            case "share":
                if (["write", "owner"].includes(access.accessType)) {
                    return next();
                }
                break;
            case "editAccess":
            case "delete":
                if (access.accessType === "owner") {
                    return next();
                }
                break;
        }
        res.status(403).send(
            `Access denied: Cannot perform the requested ${operation}.`
        );
    } catch (error) {
        res.status(500).send(
            `Server error during access check: ${error.message}`
        );
    }
}

router.post("/", async (req, res) => {
    const { name, userEmail } = req.body;

    let owner = await User.findOne({ email: userEmail });
    if (!owner) {
        owner = new User({ email: userEmail });
        await owner.save().catch((error) => {
            return res
                .status(500)
                .send("Error saving the user: " + error.message);
        });
    }

    const document = new Document({ name });
    await document.save().catch((error) => {
        return res
            .status(500)
            .send("Error saving the document: " + error.message);
    });

    const access = new Access({
        document: document._id,
        user: owner._id,
        accessType: "owner",
    });
    await access.save().catch((error) => {
        return res
            .status(500)
            .send("Error setting owner access: " + error.message);
    });

    res.status(201).send(document);
});

router.get(
    "/:documentId",
    (req, res, next) => {
        req.operation = "view";
        next();
    },
    checkAccess,
    async (req, res) => {
        try {
            const document = await Document.findById(req.params.documentId);
            if (!document) {
                return res.status(404).send("Document not found.");
            }
            res.send({ name: document.name });
        } catch (error) {
            res.status(500).send("Error retrieving document: " + error.message);
        }
    }
);

router.put(
    "/:documentId",
    (req, res, next) => {
        req.operation = "edit";
        next();
    },
    checkAccess,
    async (req, res) => {
        try {
            const document = await Document.findByIdAndUpdate(
                req.params.documentId,
                { name: req.body.newName },
                { new: true }
            );
            if (!document) {
                return res.status(404).send("Document not found.");
            }
            res.send(document);
        } catch (error) {
            res.status(500).send("Error updating document: " + error.message);
        }
    }
);

router.post(
    "/:documentId/access",
    (req, res, next) => {
        req.operation = "share";
        next();
    },
    checkAccess,
    async (req, res) => {
        const { accessorEmail, accessType } = req.body;
        let user = await User.findOne({ email: accessorEmail });
        if (!user) {
            user = new User({ email: accessorEmail });
            await user.save().catch((error) => {
                return res
                    .status(500)
                    .send("Error saving the user: " + error.message);
            });
        }
        let access = await Access.findOne({
            user: user._id,
            document: req.params.documentId,
        });
        if (access) {
            return res.status(403).send("Access Already exists.");
        }
        access = new Access({
            user: user._id,
            document: req.params.documentId,
            accessType,
        });
        await access.save();
        res.status(201).send("Access granted successfully.");
    }
);

router.put(
    "/:documentId/access",
    (req, res, next) => {
        req.operation = "editAccess";
        next();
    },
    checkAccess,
    async (req, res) => {
        const { accessorEmail, accessType } = req.body;
        try {
            const user = await User.findOne({ email: accessorEmail });
            if (!user) {
                return res.status(404).send("User not found.");
            }
            const access = await Access.findOneAndUpdate(
                { user: user._id, document: req.params.documentId },
                { accessType: accessType },
                { new: true }
            );
            if (!access) {
                return res.status(404).send("Access record not found.");
            }
            res.send("Access updated successfully.");
        } catch (error) {
            res.status(500).send("Error updating access: " + error.message);
        }
    }
);

router.delete(
    "/:documentId",
    (req, res, next) => {
        req.operation = "delete";
        next();
    },
    checkAccess,
    async (req, res) => {
        try {
            await Document.findByIdAndDelete(req.params.documentId);
            res.send("Document deleted successfully.");
        } catch (error) {
            res.status(500).send("Error deleting document: " + error.message);
        }
    }
);

router.get("/user/documents", async (req, res) => {
    const userEmail = req.body.userEmail;
    try {
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res
                .status(404)
                .send("User not found with the provided email.");
        }
        const accesses = await Access.find({ user: user._id }).populate(
            "document"
        );
        if (!accesses.length) {
            return res.status(404).send("No documents found for this user.");
        }
        const documents = accesses.map((access) => ({
            documentId: access.document._id,
            name: access.document.name,
            accessType: access.accessType,
        }));

        res.send(documents);
    } catch (error) {
        res.status(500).send("Error retrieving documents: " + error.message);
    }
});

module.exports = router;

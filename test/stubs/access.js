class Access {
    constructor({ document, user, accessType }) {
        this.document = document;
        this.user = user;
        this.accessType = accessType;
    }

    static findOne({ user, document }) {
        return Promise.resolve(
            user === "userId" && document === "existingId"
                ? new Access({ document, user, accessType: "owner" })
                : null
        );
    }

    static findOneAndUpdate({ user, document }, { accessType }, _) {
        return Promise.resolve(
            user === "userId" && document === "existingId"
                ? new Access({ document, user, accessType })
                : null
        );
    }

    static find(_) {
        const accessRecords = [
            { document: "doc1Id", user: "userId", accessType: "read" },
            { document: "doc2Id", user: "userId", accessType: "write" },
        ];

        const accessInstances = accessRecords.map(
            (access) => new Access(access)
        );

        return {
            populate: function (_) {
                return Promise.resolve(accessInstances);
            },
        };
    }

    save() {
        return Promise.resolve();
    }
}

module.exports = Access;

class Document {
    constructor({ name, visibility = "private" }) {
        this.name = name;
        this.visibility = visibility;
    }

    static findById(id) {
        return Promise.resolve(
            id === "existingId"
                ? new Document({
                      name: "Existing Document",
                      visibility: "public",
                  })
                : null
        );
    }

    static findByIdAndUpdate(id, { name }, _) {
        return Promise.resolve(
            id === "existingId"
                ? new Document({
                      name: name,
                      visibility: "public",
                  })
                : null
        );
    }

    static findByIdAndDelete(id) {
        return Promise.resolve(null);
    }

    save() {
        return Promise.resolve();
    }
}

module.exports = Document;

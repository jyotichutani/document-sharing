class User {
    constructor({ email }) {
        this.email = email;
        this._id = email == "exist@example.com" ? "userId" : "";
    }

    static findOne({ email }) {
        return Promise.resolve(new User({ email }));
    }

    save() {
        return Promise.resolve();
    }
}

module.exports = User;

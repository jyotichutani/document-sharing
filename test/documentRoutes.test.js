const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const supertest = require("supertest");
const mock = require("mock-require");

mock("../models/Document", require("./stubs/document"));
mock("../models/User", require("./stubs/user"));
mock("../models/Access", require("./stubs/access"));

const express = require("express");
const app = express();
app.use(express.json());
const documentRouter = require("../routes/document");
app.use("/documents", documentRouter);

const request = supertest(app);

describe("Document Routes", function () {
    afterEach(function () {
        sinon.restore();
    });

    describe("POST /documents", function () {
        it("should create a document and return 201 status", async function () {
            const res = await request
                .post("/documents")
                .send({ name: "New Doc", userEmail: "new@example.com" });
            expect(res.status).to.equal(201);
            expect(res.body.name).to.equal("New Doc");
        });
    });

    describe("GET /documents/:documentId", function () {
        it("should return the document if access is granted", async function () {
            const res = await request
                .get("/documents/existingId")
                .send({ userEmail: "exist@example.com" });
            expect(res.status).to.equal(200);
            expect(res.body.name).to.equal("Existing Document");
        });

        it("should return 404 if the document is not found", async function () {
            const res = await request
                .get("/documents/nonexistentId")
                .send({ userEmail: "exist@example.com" });
            expect(res.status).to.equal(404);
            expect(res.text).to.equal("Document not found.");
        });
    });

    describe("PUT /documents/:documentId", function () {
        it("should update the document name if the user has edit access", async function () {
            const res = await request.put("/documents/existingId").send({
                userEmail: "exist@example.com",
                newName: "Updated Name",
            });
            expect(res.status).to.equal(200);
            expect(res.body.name).to.equal("Updated Name");
        });

        it("should return 403 if the user does not have edit access", async function () {
            const res = await request.put("/documents/existingId").send({
                userEmail: "noedit@example.com",
                newName: "Updated Name",
            });
            expect(res.status).to.equal(403);
            expect(res.text).to.include("Access denied");
        });
    });

    describe("POST /documents/:documentId/access", function () {
        it("should grant access to another user if the requestor has share access", async function () {
            const res = await request
                .post("/documents/existingId/access")
                .send({
                    userEmail: "exist@example.com",
                    accessorEmail: "newuser@example.com",
                    accessType: "read",
                });
            expect(res.status).to.equal(201);
            expect(res.text).to.equal("Access granted successfully.");
        });

        it("should return 403 if the user does not have share access", async function () {
            const res = await request
                .post("/documents/existingId/access")
                .send({
                    userEmail: "nosharer@example.com",
                    accessorEmail: "newuser@example.com",
                    accessType: "read",
                });
            expect(res.status).to.equal(403);
            expect(res.text).to.include("Access denied");
        });
    });

    describe("PUT /documents/:documentId/access", function () {
        it("should update access type for an existing user", async function () {
            const res = await request.put("/documents/existingId/access").send({
                userEmail: "exist@example.com",
                accessorEmail: "exist@example.com",
                accessType: "write",
            });
            expect(res.status).to.equal(200);
            expect(res.text).to.equal("Access updated successfully.");
        });
    });

    describe("DELETE /documents/:documentId", function () {
        it("should delete the document if the user is the owner", async function () {
            const res = await request
                .delete("/documents/existingId")
                .send({ userEmail: "exist@example.com" });
            expect(res.status).to.equal(200);
            expect(res.text).to.equal("Document deleted successfully.");
        });

        it("should return 403 if the user is not the owner", async function () {
            const res = await request
                .delete("/documents/existingId")
                .send({ userEmail: "notowner@example.com" });
            expect(res.status).to.equal(403);
            expect(res.text).to.include("Access denied");
        });
    });

    describe("GET /documents/user/documents", function () {
        it("should return all documents the user has access to", async function () {
            const res = await request
                .get("/documents/user/documents")
                .send({ userEmail: "exist@example.com" });
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an("array");
            expect(res.body.length).to.be.above(0);
        });
    });
});

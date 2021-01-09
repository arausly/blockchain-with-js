const server = require("./server");
const request = require("supertest");

describe("API routes tests", () => {
  it("should respond with the blockchain and give a 200 status", (done) => {
    request(server)
      .get("/blockchain")
      .set("accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((res) => {
        expect(res.body.chain.length).toBeGreaterThanOrEqual(1);
        done();
      });
  });

  it("should respond with a 400 status for missing required fields", (done) => {
    /**
     * required fields
     * -- amount
     * -- input  (sender)
     * -- output (receiver)
     */
    //imitate a double-spend possibility
    request(server)
      .post("/transaction")
      .send({ amount: 35, output: "paul" })
      .set("Accept", "application/json")
      .expect(400, done);
  });

  it("should create a new transaction for complete parameters provided", (done) => {
    request(server)
      .post("/transaction")
      .send({ amount: 35, output: "paul", input: "daniel" })
      .set("Accept", "application/json")
      .expect(200)
      .then((res) => {
        expect(res.body.note).toBeTruthy();
        done();
      });
  });
});

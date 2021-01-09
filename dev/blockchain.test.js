const sha256 = require("sha256");
const Blockchain = require("./blockchain");

describe("Blockchain", () => {
  let bitcoin = new Blockchain();

  it("should have one block and no unconfirmed transactions at the start", () => {
    expect(bitcoin.chain.length).toBe(1);
    expect(bitcoin.unconfirmedTransactions.length).toBe(0);
  });

  it("it should create a new block when createNewBlock method is called", () => {
    const nonce = 432323;
    const hash = "itwaswhiteassnow";
    const previousHashBlock = "maryhadalittlelamb";
    bitcoin.createNewBlock(nonce, previousHashBlock, hash);
    expect(bitcoin.chain.length).toBe(2);
  });

  it("creates new unconfirmed transaction successfully", () => {
    const nextBlockNumber = bitcoin.createNewTransaction(32, "daniel", "paul");
    expect(bitcoin.unconfirmedTransactions.length).toBe(1);
    expect(nextBlockNumber).toBe(bitcoin.chain.length);
  });

  it("should be able to hash a block and return the hash", () => {
    const previousBlockHash = bitcoin.getLastBlock()["previousBlockHash"];
    const nonce = 432329;
    const hash = bitcoin.hashBlock(
      previousBlockHash,
      bitcoin.unconfirmedTransactions,
      nonce
    );
    const stringifiedData = `${previousBlockHash}${nonce}${JSON.stringify(
      bitcoin.unconfirmedTransactions
    )}`;
    expect(hash).toBe(sha256(stringifiedData));
  });

  it("should generate nonce that gives a hash with 4 leading zeros", () => {
    const previousBlockHash = bitcoin.getLastBlock()["previousBlockHash"];
    const nonce = bitcoin.proofOfWork(
      previousBlockHash,
      bitcoin.unconfirmedTransactions
    );
    expect(nonce.toString().length).toBe(5);
  });

  it("should be able to mine successfully removing unconfirmed transactions from the mempool", () => {
    const nonce = 43883273;
    const hash = "olorunabayeoh";
    const previousHashBlock = "youaremighty";
    expect(bitcoin.unconfirmedTransactions.length).toBe(1);
    bitcoin.createNewBlock(nonce, previousHashBlock, hash);
    expect(bitcoin.chain.length).toBe(3);
    expect(bitcoin.getLastBlock()["transactions"].length).toBe(1);
    expect(bitcoin.unconfirmedTransactions.length).toBe(0);
  });
});

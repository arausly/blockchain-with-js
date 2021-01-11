const sha256 = require("sha256");
const port = process.argv[2];

class Blockchain {
  constructor() {
    this.chain = [];
    this.unconfirmedTransactions = [];
    this.currentNodeUrl = `http://localhost:${port}`;
    this.networkNodes = [];
    this.createNewBlock(100, "000000", "000000");
  }

  /**
   * @param {number} nonce
   * @param {string} previousBlockHash  Hash of the previous block or the last block in the block chain
   * @param {string} hash the current hash for the block to be newly created
   */
  createNewBlock = (nonce, previousBlockHash, hash) => {
    const newBlock = {
      index: this.chain.length,
      timestamp: Date.now(),
      transactions: this.unconfirmedTransactions,
      nonce,
      hash,
      previousBlockHash,
    };
    this.unconfirmedTransactions = [];
    this.chain.push(newBlock);
    return newBlock;
  };

  /**
   * @returns {number} the last block in the blockchain
   */
  getLastBlock = () => {
    return this.chain[this.chain.length - 1];
  };

  /**
   *
   * @param {number} amount amount of bitcoins transacted
   * @param {string} input sender
   * @param {string} output recipient
   * @returns {number} next block number that this new unconfirmed transaction will be added to
   */
  createNewTransaction = (amount, input, output) => {
    const newTransaction = {
      amount,
      input,
      output,
    };
    this.unconfirmedTransactions.push(newTransaction);

    return this.getLastBlock()["index"] + 1;
  };

  hashBlock = (previousBlockHash, blockData, nonce) => {
    const stringifiedData = `${previousBlockHash}${nonce}${JSON.stringify(
      blockData
    )}`;
    const hash = sha256(stringifiedData);
    return hash;
  };

  proofOfWork = (previousBlockHash, blockData) => {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, blockData, nonce);
    while (!hash.startsWith("0000")) {
      nonce++;
      hash = this.hashBlock(previousBlockHash, blockData, nonce);
    }
    return nonce;
  };
}

module.exports = Blockchain;

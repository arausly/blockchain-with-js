const sha256 = require("sha256");
const { v4: uuidv4 } = require("uuid");

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
      txRef: uuidv4().replace(/\-/g, ""),
    };
    return newTransaction;
  };

  pushToUnconfirmedTransactions = (transaction) => {
    this.unconfirmedTransactions.push(transaction);
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

  chainIsValid = (blockchain) => {
    let validChain = true;
    for (let i = 1; i < blockchain.chain.length; i++) {
      const currentBlock = blockchain.chain[i];
      const prevBlock = blockchain.chain[i - 1];
      const blockData = {
        transactions: currentBlock.transactions,
        index: currentBlock.index,
      };
      const newHash = this.hashBlock(
        prevBlock.hash,
        blockData,
        currentBlock.nonce
      );
      if (!newHash.startsWith("0000")) {
        validChain = false;
        break;
      }
      if (prevBlock.hash !== currentBlock.previousBlockHash) {
        validChain = false;
        break;
      }
    }
    return validChain;
  };

  getBlock = (hash) => {
    return this.chain.find((block) => block.hash === hash) || null;
  };

  getTransaction = (transactionId) => {
    let _block = null,
      _transaction = null;

    this.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        if (transaction.txRef === transactionId) {
          _block = block;
          _transaction = transaction;
        }
      });
    });

    return {
      block: _block,
      transaction: _transaction,
    };
  };
}

module.exports = Blockchain;

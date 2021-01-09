const express = require("express");
const { v4: uuidv4 } = require("uuid");

const nodeAddress = uuidv4().replace(/\-/g, "");

const Blockchain = require("./blockchain");
const bitcoin = new Blockchain();

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.get("/blockchain", (req, res) => {
  res.json(bitcoin);
});

server.post("/transaction", (req, res) => {
  const { amount, input, output } = req.body;
  if (!amount || !input || !output) {
    return res.status(400).json({ msg: "Missing required parameter(s)" });
  }
  const nextBlockNumber = bitcoin.createNewTransaction(amount, input, output);
  res.json({
    note: `Transaction will be added to the #${nextBlockNumber} block`,
  });
});

server.get("/mine", (req, res) => {
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock["hash"];
  const currentBlockData = {
    transactions: bitcoin.unconfirmedTransactions,
    index: lastBlock["index"] + 1,
  };
  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  const hash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);

  bitcoin.createNewTransaction(6.25, "00-COINBASE", nodeAddress);

  const block = bitcoin.createNewBlock(nonce, previousBlockHash, hash);
  return res.status(200).json({
    msg: "Successfully mined new block",
    block,
  });
});

module.exports = server;

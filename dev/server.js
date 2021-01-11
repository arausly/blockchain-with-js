const express = require("express");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

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

server.post("/register-and-broadcast-node", (req, res) => {
  const networkNodeUrl = req.body.networkNodeUrl;
  if (!bitcoin.networkNodes.includes(networkNodeUrl)) {
    bitcoin.networkNodes.push(networkNodeUrl);
  }

  Promise.all(
    bitcoin.networkNodes.map(async (nodeUrl) => {
      return await axios.post(`${nodeUrl}/register-node`, {
        networkNodeUrl,
      });
    })
  )
    .then(async () => {
      return await axios.post(`${networkNodeUrl}/register-bulk-nodes`, {
        allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
      });
    })
    .then(() => {
      return res.json({
        msg: `Successfully added ${networkNodeUrl} to the blockchain network`,
      });
    });
});

server.post("/register-node", (req, res) => {
  const networkNodeUrl = req.body.networkNodeUrl;

  if (
    !bitcoin.networkNodes.includes(networkNodeUrl) &&
    bitcoin.currentNodeUrl !== networkNodeUrl
  ) {
    bitcoin.networkNodes.push(networkNodeUrl);
    return res.status(200).json({
      msg: `Successfully registered ${networkNodeUrl}`,
    });
  }

  return res.status(200).json({
    msg: `node is already registered`,
  });
});

server.post("/register-bulk-nodes", (req, res) => {
  const allNetworkNodes = req.body.allNetworkNodes;
  const bulkNodes = [];
  allNetworkNodes.forEach((networkNodeUrl) => {
    if (networkNodeUrl !== bitcoin.currentNodeUrl) {
      bulkNodes.push(networkNodeUrl);
    }
  });
  bitcoin.networkNodes = bulkNodes;
  return res.status(200).json({
    msg: "Successfully bulk registration for all network nodes",
  });
});

module.exports = server;

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
  const nextBlockNumber = bitcoin.pushToUnconfirmedTransactions(
    req.body.transaction
  );
  res.json({
    note: `Transaction will be added to the #${nextBlockNumber} block`,
  });
});

server.post("/transaction/broadcast", (req, res) => {
  const { amount, input, output } = req.body;
  if (!amount || !input || !output) {
    return res.status(400).json({ msg: "Missing required parameter(s)" });
  }
  const transaction = bitcoin.createNewTransaction(amount, input, output);
  const nextBlockNumber = bitcoin.pushToUnconfirmedTransactions(transaction);
  Promise.all(
    bitcoin.networkNodes.map(async (nodeUrl) => {
      return await axios.post(`${nodeUrl}/transaction`, {
        transaction,
      });
    })
  ).then(() => {
    res.json({
      note: `Transaction has been created successfully and will be add on ${nextBlockNumber}`,
    });
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
  const transactionObj = {
    amount: 6.25,
    input: "00-COINBASE",
    output: nodeAddress,
  };

  const block = bitcoin.createNewBlock(nonce, previousBlockHash, hash);

  Promise.all(
    bitcoin.networkNodes.map(async (nodeUrl) => {
      return await axios.post(`${nodeUrl}/receive-new-block`, {
        block,
      });
    })
  )
    .then(() => {
      return axios.post(
        `${bitcoin.currentNodeUrl}/transaction/broadcast`,
        transactionObj
      );
    })
    .then(() => {
      return res.status(200).json({
        msg: "Successfully mined new block",
        block,
      });
    });
});

server.post("/receive-new-block", (req, res) => {
  const newBlock = req.body.block;
  const lastBlock = bitcoin.getLastBlock();
  const previousHashBlock = lastBlock.hash;
  if (previousHashBlock.hash !== newBlock.previousBlockHash) {
    bitcoin.chain.push(newBlock);
    bitcoin.unconfirmedTransactions = [];
    return res.status(200).json({
      msg: "new Block accepted",
    });
  }
  return res.status(400).json({
    msg: "Invalid block, rejected!",
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

server.post("/consensus", (req, res) => {
  Promise.all(
    bitcoin.networkNodes.map(async (nodeUrl) => {
      return await axios
        .get(`${nodeUrl}/blockchain`)
        .then((response) => response.data);
    })
  ).then((blockchains) => {
    let longestChain = bitcoin;
    let thereIsLongerChain = false;
    let newMemPool = null;
    blockchains.forEach(async (blockchain) => {
      if (blockchain.chain.length > longestChain.chain.length) {
        longestChain = blockchain;
        thereIsLongerChain = true;
        newMemPool = blockchain.unconfirmedTransactions;
      }
    });

    const longestChainIsValid = bitcoin.chainIsValid(longestChain);
    console.log({ thereIsLongerChain, longestChainIsValid });
    if (!thereIsLongerChain || (thereIsLongerChain && !longestChainIsValid)) {
      return res.status(200).json({
        msg: "blockchain was not replaced",
        chain: bitcoin.chain,
      });
    } else {
      bitcoin.chain = longestChain.chain;
      bitcoin.unconfirmedTransactions = newMemPool;
      return res.status(200).json({
        msg: "blockchain has been replaced",
        chain: bitcoin.chain,
      });
    }
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

server.get("/block/:hash", (req, res) => {
  const block = bitcoin.getBlock(req.params.hash);
  return res.status(200).json({
    block,
  });
});

server("/transaction/:transactionId", (req, res) => {
  const txObj = bitcoin.getTransaction(req.params.transactionId);
  return res.json(txObj);
});

server("/address/:address", (req, res) => {
  const addressInfo = bitcoin.getAddress(req.params.address);
  return res.json(addressInfo);
});

module.exports = server;

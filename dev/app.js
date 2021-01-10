const server = require("./server");

const port = process.argv[2];

server.listen(port, () => {
  console.log(`Server is 🏃🏃🏃 on port ${port}`);
});

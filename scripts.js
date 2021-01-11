const { exec } = require("child_process");

const handleError = (error, stderr) => {
  if (error) {
    console.log("\x1b[31m%s\x1b[0m", error.message);
    return;
  }

  if (stderr) {
    console.log("\x1b[31m%s\x1b[0m", stderr);
    return;
  }
};

const killPorts = () => {
  const ports = [4001, 4002, 4003, 4004, 4005];

  ports.map((port, i) => {
    exec(`lsof -i:${port}`, (error, stdout, stderr) => {
      handleError(error, stderr);
      const [pid] = stdout.match(/\d{5}/);
      if (pid) {
        exec(`kill ${pid}`, (error, stdout, stderr) => {
          handleError(error, stderr);
          console.log("\x1b[32m%s\x1b[0m", `[${i}] ${i + 1}/4 Stopped ${port}`);
        });
      }
    });
  });
};

killPorts();

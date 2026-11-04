const { spawnSync } = require("node:child_process");

const coverage = process.argv[2] === "coverage";
const composeArgs = ["compose", "-f", "docker-compose.test.yml"];
if (coverage) composeArgs.push("-f", "docker-compose.coverage.yml");

function runDocker(args) {
  return spawnSync("docker", [...composeArgs, ...args], {
    stdio: "inherit",
    shell: false,
  });
}

const result = runDocker([
  "up",
  "--build",
  "--abort-on-container-exit",
  "--exit-code-from",
  "tests",
]);

const cleanup = runDocker(["down", "--volumes", "--remove-orphans"]);

if (result.error) {
  console.error(`Não foi possível executar o Docker: ${result.error.message}`);
  process.exitCode = 1;
} else if (result.status !== 0) {
  process.exitCode = result.status;
} else if (cleanup.status !== 0) {
  process.exitCode = cleanup.status;
}

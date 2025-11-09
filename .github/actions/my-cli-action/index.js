const core = require('@actions/core');
const { execSync } = require('child_process');

async function run() {
  try {
    const version = core.getInput('version') || 'latest';
    console.log(`Installing MyCLI version: ${version}...`);

    execSync(`curl -fsSL https://cli.example.com/install.sh | sh`, { stdio: 'inherit' });

    // Add MyCLI to PATH
    const cliPath = `${process.env.HOME}/.mycli/bin`;
    core.addPath(cliPath);

    console.log("MyCLI installed successfully.");
    execSync(`mycli --version`, { stdio: 'inherit' });
  } catch (error) {
    core.setFailed(`Installation failed: ${error.message}`);
  }
}

run();

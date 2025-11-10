const core = require('@actions/core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const version = core.getInput('version') || 'latest';
    console.log(`Installing MyCLI version: ${version}...`);

    // Run installer under bash with pipefail so failures in curl or the pipe
    // cause a non-zero exit code and throw in execSync.
    const installCmd = `bash -lc "set -euo pipefail; curl -fsSL https://cli.example.com/install.sh | sh -s -- ${version}"`;
    execSync(installCmd, { stdio: 'inherit' });

    // Determine the expected bin path of the installed CLI
    const cliPath = path.join(process.env.HOME || '/', '.mycli', 'bin');

    // Check if the binary exists at the expected location
    const binaryPath = path.join(cliPath, 'mycli');
    const binaryExists = fs.existsSync(binaryPath);

    // Also check if mycli is already available on PATH
    let onPath = false;
    try {
      const whichOut = execSync('command -v mycli', { stdio: 'pipe' }).toString().trim();
      if (whichOut) onPath = true;
    } catch (e) {
      onPath = false;
    }

    if (!binaryExists && !onPath) {
      throw new Error('Installer did not produce a `mycli` binary and it is not on PATH');
    }

    // Preferred: use actions core helper to add to PATH for subsequent steps when needed
    if (!onPath) {
      try {
        core.addPath(cliPath);
        console.log(`Added ${cliPath} to PATH via core.addPath`);
      } catch (e) {
        console.warn('core.addPath failed or not available, falling back to $GITHUB_PATH');
      }

      // Append to $GITHUB_PATH when available so the runner persists the PATH change
      const githubPath = process.env.GITHUB_PATH;
      if (githubPath) {
        fs.appendFileSync(githubPath, `${cliPath}\n`, { encoding: 'utf8' });
        console.log(`Appended ${cliPath} to $GITHUB_PATH`);
      }
    } else {
      console.log('mycli already available on PATH; skipping PATH modification');
    }

    console.log('MyCLI installed successfully. Verifying...');
    execSync('mycli --version', { stdio: 'inherit' });
  } catch (error) {
    // If @actions/core is present we can use setFailed, otherwise exit non-zero
    if (core && typeof core.setFailed === 'function') {
      core.setFailed(`Installation failed: ${error && error.message ? error.message : error}`);
    } else {
      console.error(`Installation failed: ${error && error.message ? error.message : error}`);
      process.exit(1);
    }
  }
}

run();

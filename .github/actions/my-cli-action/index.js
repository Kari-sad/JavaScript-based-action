const core = require('@actions/core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const version = core.getInput('version') || 'latest';
    console.log(`Installing MyCLI version: ${version}...`);

    // Pass version to installer if it supports it
    execSync(`curl -fsSL https://cli.example.com/install.sh | sh -s -- ${version}`, { stdio: 'inherit' });

    // Determine the expected bin path of the installed CLI
    const cliPath = path.join(process.env.HOME || '/', '.mycli', 'bin');

    // Preferred: use actions core helper to add to PATH for subsequent steps
    try {
      core.addPath(cliPath);
      console.log(`Added ${cliPath} to PATH via core.addPath`);
    } catch (e) {
      console.warn('core.addPath failed or not available, falling back to $GITHUB_PATH');
    }

    // Always append to $GITHUB_PATH when available so the runner persists the PATH change
    const githubPath = process.env.GITHUB_PATH;
    if (githubPath) {
      fs.appendFileSync(githubPath, `${cliPath}\n`, { encoding: 'utf8' });
      console.log(`Appended ${cliPath} to $GITHUB_PATH`);
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

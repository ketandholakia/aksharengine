const fs = require('fs');
const path = require('path');

const profilesDir = path.join(__dirname, '..', 'public', 'profiles');

function loadProfile(fileName) {
  const filePath = path.join(profilesDir, fileName);
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function getOutputChars(mappings) {
  // Collect all unique output strings from mappings
  const outputs = new Set();
  for (const mapping of mappings) {
    if (mapping.output && typeof mapping.output === 'string') {
      outputs.add(mapping.output);
    }
  }
  return outputs;
}

function auditProfile(profileName, profile) {
  const issues = [];

  // Check leftMatraSymbols
  if (profile.reorderingRules && profile.reorderingRules.leftMatraSymbols) {
    const outputs = getOutputChars(profile.mappings);
    for (const symbol of profile.reorderingRules.leftMatraSymbols) {
      // Check if symbol appears in any output string (as substring)
      let found = false;
      for (const output of outputs) {
        if (output.includes(symbol)) {
          found = true;
          break;
        }
      }
      if (!found) {
        issues.push({
          type: 'leftMatraSymbols',
          symbol,
          message: `leftMatraSymbols contains '${symbol}' which does not appear in any mapping output`
        });
      }
    }
  }

  // Check rephSymbols
  if (profile.reorderingRules && profile.reorderingRules.rephSymbols) {
    const outputs = getOutputChars(profile.mappings);
    for (const symbol of profile.reorderingRules.rephSymbols) {
      let found = false;
      for (const output of outputs) {
        if (output.includes(symbol)) {
          found = true;
          break;
        }
      }
      if (!found) {
        issues.push({
          type: 'rephSymbols',
          symbol,
          message: `rephSymbols contains '${symbol}' which does not appear in any mapping output`
        });
      }
    }
  }

  return issues;
}

function main() {
  const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.json'));
  let totalIssues = 0;

  for (const file of files) {
    try {
      const profile = loadProfile(file);
      const issues = auditProfile(path.parse(file).name, profile);
      if (issues.length > 0) {
        console.log(`${file}:`);
        for (const issue of issues) {
          console.log(`  - ${issue.message}`);
        }
        totalIssues += issues.length;
      }
    } catch (e) {
      console.error(`Error processing ${file}: ${e.message}`);
    }
  }

  if (totalIssues === 0) {
    console.log('No issues found in profiles.');
  } else {
    console.log(`\nTotal issues found: ${totalIssues}`);
  }
}

main();
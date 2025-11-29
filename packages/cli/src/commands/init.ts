import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";
import {
  CODEPLAN_FOLDER,
  getInitFiles,
  getClaudeMdSnippet,
} from "@codeplan/core";
import {
  isClaudeCodeInstalled,
  registerMcpServer,
  printManualMcpInstructions,
} from "../utils/claude.js";

interface InitOptions {
  name: string;
  skipMcp: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const codeplanPath = path.join(cwd, CODEPLAN_FOLDER);

  console.log();
  console.log(pc.bold("Initializing Codeplan..."));
  console.log();

  // Check if already initialized
  if (fs.existsSync(codeplanPath)) {
    console.log(pc.yellow(`${CODEPLAN_FOLDER}/ already exists`));
    console.log(pc.dim("Skipping folder creation"));
  } else {
    // Create .codeplan folder and files
    fs.mkdirSync(codeplanPath, { recursive: true });

    const files = getInitFiles(options.name);
    for (const file of files) {
      const filePath = path.join(cwd, file.path);
      fs.writeFileSync(filePath, file.content, "utf-8");
      console.log(pc.green("✓"), pc.dim(`Created ${file.path}`));
    }
  }

  // Handle CLAUDE.md
  const claudeMdPath = path.join(cwd, "CLAUDE.md");
  const snippet = getClaudeMdSnippet();

  if (fs.existsSync(claudeMdPath)) {
    const content = fs.readFileSync(claudeMdPath, "utf-8");
    if (!content.includes("Codeplan")) {
      fs.appendFileSync(claudeMdPath, `\n\n${snippet}`);
      console.log(pc.green("✓"), pc.dim("Updated CLAUDE.md with Codeplan instructions"));
    } else {
      console.log(pc.dim("  CLAUDE.md already contains Codeplan instructions"));
    }
  } else {
    fs.writeFileSync(claudeMdPath, `# Project Instructions\n\n${snippet}`, "utf-8");
    console.log(pc.green("✓"), pc.dim("Created CLAUDE.md"));
  }

  console.log();

  // Handle MCP registration
  if (options.skipMcp) {
    console.log(pc.dim("Skipped MCP server registration (--skip-mcp)"));
    printManualMcpInstructions();
  } else {
    console.log(pc.bold("Configuring Claude Code integration..."));
    console.log();

    // Create .claude/settings.json to enable project MCP servers
    const claudeSettingsDir = path.join(cwd, ".claude");
    const claudeSettingsPath = path.join(claudeSettingsDir, "settings.json");

    if (!fs.existsSync(claudeSettingsDir)) {
      fs.mkdirSync(claudeSettingsDir, { recursive: true });
    }

    const settings = fs.existsSync(claudeSettingsPath)
      ? JSON.parse(fs.readFileSync(claudeSettingsPath, "utf-8"))
      : {};

    if (!settings.enableAllProjectMcpServers) {
      settings.enableAllProjectMcpServers = true;
      fs.writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2), "utf-8");
      console.log(pc.green("✓"), pc.dim("Created .claude/settings.json"));
    }

    if (!isClaudeCodeInstalled()) {
      console.log(pc.yellow("⚠"), "Claude Code CLI not detected");
      printManualMcpInstructions();
    } else {
      const result = registerMcpServer();
      if (result.success) {
        console.log(pc.green("✓"), result.message);
      } else {
        console.log(pc.yellow("⚠"), result.message);
        printManualMcpInstructions();
      }
    }
  }

  console.log();
  console.log(pc.green(pc.bold("Codeplan initialized!")));
  console.log();
  console.log("Next steps:");
  console.log(pc.dim("  1. Review .codeplan/config.yaml"));
  console.log(pc.dim("  2. Start a Claude Code session"));
  console.log(pc.dim("  3. Ask Claude to create tasks for you"));
  console.log();
}

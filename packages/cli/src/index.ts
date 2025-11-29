import { Command } from "commander";
import { initCommand } from "./commands/init.js";

const program = new Command();

program
  .name("codeplan")
  .description("AI-native project planning for developers")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize Codeplan in the current directory")
  .option("-n, --name <name>", "Project name", "My Project")
  .option("--skip-mcp", "Skip MCP server registration with Claude Code")
  .action(initCommand);

program.parse();

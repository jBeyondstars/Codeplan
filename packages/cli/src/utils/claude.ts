import { spawnSync } from "node:child_process";
import pc from "picocolors";

const MCP_SERVER_PATH = "node_modules/@codeplan/mcp/dist/index.js";

/**
 * Check if Claude Code CLI is installed
 */
export function isClaudeCodeInstalled(): boolean {
  try {
    const result = spawnSync("claude", ["--version"], {
      encoding: "utf-8",
      shell: true,
      stdio: "pipe",
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Register the Codeplan MCP server with Claude Code
 */
export function registerMcpServer(): { success: boolean; message: string } {
  if (!isClaudeCodeInstalled()) {
    return {
      success: false,
      message: "Claude Code CLI not found. Install it first, then run: claude mcp add codeplan node <path-to-mcp>",
    };
  }

  try {
    // Use --scope project to register for the current project only
    const result = spawnSync(
      "claude",
      ["mcp", "add", "--scope", "project", "codeplan", "node", MCP_SERVER_PATH],
      {
        encoding: "utf-8",
        shell: true,
        stdio: "pipe",
        cwd: process.cwd(),
      }
    );

    if (result.status === 0) {
      return {
        success: true,
        message: "MCP server registered with Claude Code",
      };
    }

    // Check if already registered
    if (result.stderr?.includes("already exists")) {
      return {
        success: true,
        message: "MCP server already registered with Claude Code",
      };
    }

    return {
      success: false,
      message: `Failed to register MCP server: ${result.stderr || result.stdout}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error registering MCP server: ${error}`,
    };
  }
}

/**
 * Print instructions for manual MCP setup
 */
export function printManualMcpInstructions(): void {
  console.log();
  console.log(pc.yellow("To enable AI task management, register the MCP server:"));
  console.log();
  console.log(pc.dim(`  claude mcp add codeplan node ${MCP_SERVER_PATH}`));
  console.log();
}

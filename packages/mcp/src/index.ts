#!/usr/bin/env node
/**
 * Codeplan MCP Server
 *
 * Provides tools for AI agents to manage project tasks.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { createTaskTool, handleCreateTask } from "./tools/create-task.js";
import { listTasksTool, handleListTasks } from "./tools/list-tasks.js";
import { updateStatusTool, handleUpdateStatus } from "./tools/update-status.js";
import { getContextTool, handleGetContext } from "./tools/get-context.js";

const server = new Server(
  {
    name: "codeplan",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [createTaskTool, listTasksTool, updateStatusTool, getContextTool],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "codeplan_create_task":
      return handleCreateTask(args);

    case "codeplan_list_tasks":
      return handleListTasks(args);

    case "codeplan_update_status":
      return handleUpdateStatus(args);

    case "codeplan_get_context":
      return handleGetContext(args);

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Codeplan MCP server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

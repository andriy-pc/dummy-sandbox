import asyncio
import json
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from dotenv import load_dotenv

from lite_llm_client import LiteLLMClient
from settings import LLMSettings

load_dotenv()  # load environment variables from .env

class MCPClient:
    def __init__(self):
        self.session: ClientSession | None = None
        self.llm_client = LiteLLMClient(LLMSettings())
        self.exit_stack = AsyncExitStack()

    async def connect_to_server(self, server_script_path: str):
        """Connect to an MCP server (local Python server only)."""
        if not server_script_path.endswith(".py"):
            raise ValueError("Server script must be a .py file")

        """
        Launching `server` as a subprocess (literally runs python <your_script.py> on your machine), 
        because this is local/stdio transport mode — the MCP protocol communicates over stdin/stdout pipes between client and server.
        For that to work, the client needs to own the subprocess so it can attach those pipes directly. 
        If you launched the server yourself, the client would have no way to connect to its stdin/stdout.
        """
        server_params = StdioServerParameters(
            command="python",
            args=[server_script_path],
            env=None,
        )

        stdio_transport = await self.exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(self.stdio, self.write)
        )
        await self.session.initialize()

        response = await self.session.list_tools()
        print("\nConnected to server with tools:", [tool.name for tool in response.tools])

    async def process_query(self, query: str) -> str:
        """Process a query using the LLM, calling tools as needed (agentic loop)."""
        messages = [{"role": "user", "content": query}]

        # Fetch and convert available tools once
        tool_response = await self.session.list_tools()
        available_tools = [
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.inputSchema,
            }
            for tool in tool_response.tools
        ]

        final_text: list[str] = []

        # Agentic loop — keep going until the model stops calling tools
        while True:
            response = await self.llm_client.complete(
                messages=messages,
                tools=available_tools,
            )

            message = response.choices[0].message

            # No tool call — we have a final answer
            if not message.tool_calls:
                if message.content:
                    final_text.append(message.content)
                break

            # Process every tool call the model requested in this turn
            # Append the full assistant message (with tool_calls) to history
            messages.append({
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in message.tool_calls
                ],
            })

            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                try:
                    arguments = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    arguments = {}

                final_text.append(f"[Calling tool '{tool_name}' with args {arguments}]")

                # Execute the tool via MCP
                result = await self.session.call_tool(tool_name, arguments)
                tool_result_text = (
                    result.content[0].text if result.content else ""
                )

                # Append tool result with the correct role and tool_call_id
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result_text,
                })

        return "\n".join(final_text)

    async def chat_loop(self):
        """Run an interactive chat loop."""
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")

        while True:
            try:
                query = input("\nQuery: ").strip()
                if query.lower() == "quit":
                    break
                response = await self.process_query(query)
                print("\n" + response)
            except Exception as e:
                print(f"\nError: {e}")

    async def cleanup(self):
        """Clean up resources."""
        await self.exit_stack.aclose()

async def main():
    if len(sys.argv) < 2:
        print("Usage: python client.py <path_to_server_script>/<script_name>.py")
        sys.exit(1)

    client = MCPClient()
    try:
        await client.connect_to_server(sys.argv[1])
        await client.chat_loop()
    finally:
        await client.cleanup()

if __name__ == "__main__":
    import sys
    asyncio.run(main())
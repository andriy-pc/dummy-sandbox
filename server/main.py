import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Dummy MCP Server", json_response=True)

@mcp.tool()
def internal_api_health() -> str:
    url = "http://localhost:8000/api/v1/health"
    response = httpx.get(url)
    return response.json()["status"]

def main():
    mcp.run(transport="stdio")

if __name__ == "__main__":
    main()
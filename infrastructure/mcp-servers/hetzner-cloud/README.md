# Hetzner Cloud MCP Server

A Model Context Protocol (MCP) server for managing Hetzner Cloud resources via Claude Desktop, Cursor, or other MCP-compatible clients.

## Features

- **10 Powerful Tools** for managing Hetzner Cloud infrastructure:
  - `list_servers` - List all servers with basic info
  - `get_server_details` - Get detailed server information
  - `create_server` - Create new servers
  - `restart_server` - Reboot servers gracefully
  - `get_server_status` - Get live server status and metrics
  - `ssh_command` - Execute commands on servers
  - `manage_firewall` - Manage firewall rules
  - `list_volumes` - List cloud storage volumes
  - `create_snapshot` - Create server backups/snapshots
  - `list_images` - List available OS images

- **Production-Ready**: Full error handling, input validation, and timeout protection
- **Easy Integration**: Works with Claude Desktop, Cursor, and other MCP clients
- **Secure**: Token-based authentication, no credentials stored

## Prerequisites

- Node.js 18+
- npm or yarn
- Hetzner Cloud account with API token

## Installation

1. Clone this repository or download the source code:

```bash
git clone <repository-url>
cd hetzner-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file from template:

```bash
cp .env.example .env
```

4. Add your Hetzner Cloud API token to `.env`:

```bash
HETZNER_TOKEN=your_api_token_here
SSH_TIMEOUT=30
API_TIMEOUT=30
DEBUG=false
```

Get your API token from: https://console.hetzner.cloud/account/api-tokens

5. Build the project:

```bash
npm run build
```

## Usage

### Running the Server

**Development mode** (with auto-rebuild):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The server will start and listen on stdio, ready for MCP client connections.

### Integration with Claude Desktop

Add to your Claude Desktop configuration (`~/.claude/claude_config.json`):

```json
{
  "mcpServers": {
    "hetzner": {
      "command": "node",
      "args": ["/path/to/hetzner-mcp-server/dist/index.js"],
      "env": {
        "HETZNER_TOKEN": "your-token-here"
      }
    }
  }
}
```

Or with environment file:

```json
{
  "mcpServers": {
    "hetzner": {
      "command": "node",
      "args": ["/path/to/hetzner-mcp-server/dist/index.js"],
      "env": {
        "HETZNER_TOKEN": "${HETZNER_TOKEN}"
      }
    }
  }
}
```

Then restart Claude Desktop to load the MCP server.

### Integration with Cursor

Similar to Claude Desktop, add the configuration to your `.cursor/mcp_config.json` or through Cursor's settings.

## Available Tools

### 1. list_servers
List all your Hetzner Cloud servers.

**Returns:**
- Server ID and name
- Status (running, stopped, etc.)
- Public IP address
- Server type and location
- CPU cores, RAM, and disk size

**Example:**
```
Call: list_servers
Returns: {
  servers: [
    {
      server_id: 12345,
      name: "web-server-01",
      status: "running",
      public_ip: "213.123.45.67",
      type: "cx21",
      location: "Falkenstein DC14",
      cpu_cores: 2,
      memory_gb: 4,
      disk_gb: 40
    }
  ],
  total: 1
}
```

### 2. get_server_details
Get comprehensive details about a specific server.

**Parameters:**
- `server_id` (number, required): ID of the server

**Returns:**
- Full server specs (CPU, RAM, Disk, Networks)
- Public/private IP addresses
- Image information
- Volume attachments
- Protection settings
- Load average

### 3. create_server
Create a new Hetzner Cloud server.

**Parameters:**
- `name` (string, required): Server name
- `server_type` (string, required): Type like "cx11", "cx21", "cx41", "cx51", etc.
- `image` (string, required): OS image like "ubuntu-22.04", "debian-12", or image ID
- `location` (string, optional): Location like "fsn1", "nbg1", "hel1"
- `ssh_keys` (array, optional): SSH key IDs to add
- `labels` (object, optional): Labels for organization

**Returns:**
- New server ID and details
- Action ID for monitoring creation progress
- Root password (if applicable)

### 4. restart_server
Gracefully restart a server (reboot).

**Parameters:**
- `server_id` (number, required): Server ID to restart

**Returns:**
- Action ID for monitoring progress
- Action status and progress percentage

### 5. get_server_status
Get current server status and metrics.

**Parameters:**
- `server_id` (number, required): Server ID

**Returns:**
- Current status (running, stopped, etc.)
- Load average
- Uptime information
- CPU, RAM, and disk specifications
- Traffic metrics

### 6. ssh_command
Execute a command on a server via SSH.

**Parameters:**
- `server_id` (number, required): Server ID
- `command` (string, required): Shell command to execute
- `ssh_key_path` (string, optional): Path to SSH private key (defaults to `~/.ssh/id_rsa`)

**Returns:**
- stdout and stderr
- Exit code
- Command status

**Requirements:**
- SSH public key must be added to server's authorized_keys
- Server must have a public IP
- Default timeout: 30 seconds (configurable via `SSH_TIMEOUT` env var)

### 7. manage_firewall
Manage firewall rules for a server.

**Parameters:**
- `server_id` (number, required): Server ID
- `action` (string, required): "add" or "remove"
- `protocol` (string, required): "tcp", "udp", "icmp", "esp", or "gre"
- `port` (string, optional): Port or range like "80", "443", "8000-8999"
- `source_ip` (string, optional): Source IP or CIDR (default: "0.0.0.0/0")

**Returns:**
- Rule configuration
- Instructions for applying the rule

**Note:** Hetzner Cloud uses dedicated Firewall resources. This tool helps plan rules; actual application requires using a Firewall resource via the Hetzner Console or API.

### 8. list_volumes
List all block storage volumes.

**Returns:**
- Volume ID and name
- Size in GB
- Status
- Attached server (if any)
- Location
- Storage device path

### 9. create_snapshot
Create a backup snapshot of a server.

**Parameters:**
- `server_id` (number, required): Server ID to snapshot
- `description` (string, optional): Snapshot description
- `labels` (object, optional): Labels for organization

**Returns:**
- Snapshot/Image ID
- Action ID for monitoring progress
- Action status (typically takes 5-30 minutes)

**Note:** Server will be powered off during snapshot creation.

### 10. list_images
List available operating system images and snapshots.

**Returns:**
- System images (Ubuntu, Debian, etc.)
- User snapshots
- Image specifications (disk size, OS flavor, etc.)

## Configuration

### Environment Variables

```bash
# Required
HETZNER_TOKEN=your_api_token_here

# Optional
SSH_TIMEOUT=30           # SSH command timeout in seconds
API_TIMEOUT=30          # API request timeout in seconds
DEBUG=false             # Enable debug logging
```

## Error Handling

The server handles common errors gracefully:

- **Invalid Token**: Fails at startup with clear message
- **Server Not Found**: Returns 404 error with server ID
- **SSH Timeout**: Returns timeout error with suggestions
- **Network Errors**: Provides details and retry guidance
- **Rate Limiting**: Handles Hetzner API rate limits

## Development

### Build

```bash
npm run build
```

### Watch Mode (Auto-rebuild)

```bash
npm run watch
```

### Development Server

```bash
npm run dev
```

## Troubleshooting

### "HETZNER_TOKEN environment variable is required"

Make sure:
1. `.env` file exists in project root
2. `HETZNER_TOKEN` is set in the `.env` file
3. Your token is valid (check at console.hetzner.cloud)

### SSH Command Fails

1. Verify server IP: `get_server_details`
2. Check SSH key: Ensure `~/.ssh/id_rsa` exists or use `ssh_key_path` parameter
3. Add your public key to server: Create server with `ssh_keys` parameter
4. Check firewall: Ensure SSH (port 22) is allowed

### Server Creation Times Out

- This is normal for larger server types
- Use `get_server_status` to check progress
- Snapshots take 5-30 minutes; check action progress with the action ID

## API Reference

All tools return structured JSON responses. Error responses include:
- `isError: true` flag
- Detailed error message
- Suggested next steps where applicable

## Security Notes

- Never share your `HETZNER_TOKEN` or commit it to version control
- Use environment variables or secure secret management
- This server should only run in trusted environments
- SSH key security is your responsibility

## Limitations

- Hetzner API rate limit: 3600 requests/hour
- SSH commands limited to 30 seconds by default
- Snapshot creation powers off the server
- Some advanced Firewall features require manual Hetzner Console access

## Contributing

Improvements and bug reports welcome!

## License

MIT

## Support

For issues with:
- **Hetzner Cloud API**: See https://docs.hetzner.cloud/
- **MCP Protocol**: See https://modelcontextprotocol.io/
- **This Server**: Check GitHub issues or create a new one

## Changelog

### v1.0.0
- Initial release with 10 core tools
- Full Hetzner Cloud API integration
- Production-ready error handling

---

**Built with ❤️ for Hetzner Cloud + Claude/Cursor**

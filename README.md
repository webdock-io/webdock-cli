# Webdock CLI

The official command-line interface for managing your Webdock.io resources.

`webdock` allows you to manage servers, SSH keys, events, and more directly from your terminal, making it easy to script, automate, and integrate your Webdock infrastructure into your workflows.

Running `webdock` without a subcommand starts interactive mode. The reference below documents the non-interactive command set.

<img src="assets/webdock.gif" alt="Webdock Interactive Mode" style="width:100%;border-radius:10px">

## Prerequisites

Before you can use webdock-cli, you need a Webdock API Token.

You can generate an API token from your Webdock account dashboard in the API Tokens section.

## Installation

### Linux

You can install webdock-cli using our convenient installer script. It will download the latest binary for your system and place it in /usr/local/bin.

```bash
curl -fsSL 'https://cli-src.webdock.tech/install/linux.sh' | sudo bash
```

### Windows (PowerShell)

For Windows, run the following command in an administrator PowerShell terminal. This will download and execute the installer script.

```powershell
irm 'https://cli-src.webdock.tech/install/windows.ps1' | iex
```

### MacOS

```macos
curl -fsSL 'https://cli-src.webdock.tech/install/mac.sh' | sudo bash
```

## Table of Contents

- [init](#init)
- [account](#account)
- [events](#events)
- [hooks](#hooks)
- [images](#images)
- [locations](#locations)
- [profiles](#profiles)
- [scripts](#scripts)
- [servers](#servers)
- [shellusers](#shellusers)
- [snapshots](#snapshots)
- [sshkeys](#sshkeys)
- [update](#update)

---

## `init`

**Initialize the CLI with your API token.**

```
webdock init -t <token>
```

- `-t, --token <token>`: API token for authentication (required)

---

## `account`

**Manage account information.**

### Subcommands:

- `info`: Get account information
  - `-t, --token <token>`: API token for authentication
  - `--json`: Output as JSON
  - `--csv`: Output as CSV
- `archived-servers`: List archived servers
  - `-t, --token <token>`: API token for authentication
  - `--json`: Output as JSON
  - `--csv`: Output as CSV

---

## `events`

**Manage account events.**

### Subcommands:

- `list`: List all events
  - `-t, --token <token>`: API token for authentication
  - `-p, --page <page>`: Page number (default: 1)
  - `-l, --limit <limit>`: Events per page (default: 15)
  - `-y, --type <type>`: Filter by event type
  - `--json`: Output as JSON
  - `--csv`: Output as CSV

**Event Types:** provision, restore-server, change-profile, set-state, delete, backup, set-hostnames, update-webroot, setup-ssl, install-wordpress, manage-wordpress, manage-shelluser, manage-keys,
toggle-passwordauth, manage-mysql, manage-dbuser, manage-ftpuser, set-php-settings, cronjob, pull-file, push-file, delete-file, execute-file

---

## `hooks`

**Manage event hooks and callbacks.**

### Subcommands:

- `list`: List event hooks
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `create <callbackUrl>`: Create a new event hook
  - `-t, --token <token>`: API token
  - `-i, --callback-id <id>`: Optional callback ID
  - `-e, --event-type <eventType>`: Optional event type
  - `--json`, `--csv`
- `get <id>`: Get details of a specific hook
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `delete <id>`: Delete an event hook
  - `-t, --token <token>`: API token
  - `-f, --force`: Force deletion

---

## `images`

**Manage server images.**

### Subcommands:

- `list`: List all images
  - `-t, --token <token>`: API token
  - `--json`, `--csv`

---

## `locations`

**Manage server locations.**

### Subcommands:

- `list`: List all locations
  - `-t, --token <token>`: API token
  - `--json`, `--csv`

---

## `profiles`

**Manage server profiles.**

### Subcommands:

- `create`: Create a custom hardware profile
  - `-t, --token <token>`: API token
  - `--cores <cores>`: Number of CPU threads
  - `--ram <ram>`: RAM in GB
  - `--disk <disk>`: Disk size in GB
  - `--network <network>`: Network bandwidth in Gbit/s
  - `--platform <platform>`: Hardware platform
  - `--json`, `--csv`
- `delete <slug>`: Delete a custom hardware profile
  - `-t, --token <token>`: API token
- `list <locationId>`: List all profiles for a location
  - `-t, --token <token>`: API token
  - `-p, --profileSlug <profileSlug>`: Filter by a specific profile slug
  - `--json`, `--csv`

---

## `scripts`

**Manage account and server scripts.**

### Subcommands:

- `list`: List all account scripts
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `create <name> <filename> <content>`: Create an account script
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `update <id> <name> <filename> <content>`: Update an account script
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `delete <id>`: Delete an account script
  - `-t, --token <token>`: API token
- `get <id>`: Get an account script by ID
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `server-list <serverSlug>`: List scripts for a server
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `server-create <serverSlug> <scriptId> <path>`: Create a script on a server
  - `-t, --token <token>`: API token
  - `-x, --executable`: Make script executable
  - `-i, --executeImmediately`: Run script after deployment
  - `--json`, `--csv`
- `server-delete <serverSlug> <scriptId>`: Delete a script from a server
  - `-t, --token <token>`: API token
- `server-execute <serverSlug> <scriptId>`: Execute a script on a server
  - `-t, --token <token>`: API token
  - `--wait`: Wait for completion

---

## `servers`

**Manage servers.**

### Subcommands:

- `list`: List all servers
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `get <slug>`: Get details of a server
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `create <name> <locationId> <profileSlug>`: Create a server
  - `-t, --token <token>`: API token
  - `-i, --imageSlug <imageSlug>`: Image slug
  - `-v, --virtualization <virtualization>`: Virtualization type
  - `-s, --slug <slug>`: Custom slug
  - `-a, --snapshotId <snapshotId>`: Restore from snapshot
  - `--wait`: Wait for server to be ready
  - `--userScriptId <id>`: "Optional user/account script ID. Retrieve it via GET /account/scripts or from the Scripts page in the dashboard. If provided, the script is deployed to
    /root/auto-deploy-script and executed once provisioning finishes (after all provisioning actions, including SSL certificate generation). The script is executed from the command line; ensure it has
    a valid shebang (e.g. #!/bin/bash, #!/usr/bin/env python3) and is self-contained. Use this to auto-deploy software, credentials, or other setup steps."
  - `--json`, `--csv`
- `delete <serverSlug>`: Delete a server
  - `-t, --token <token>`: API token
  - `--wait`: Wait for deletion
- `update <serverSlug> <name> <description> <notes> <nextActionDate>`: Update server metadata
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `start <serverSlug>`: Start a server
  - `-t, --token <token>`: API token
  - `--wait`: Wait for server to start
- `stop <serverSlug>`: Stop a server
  - `-t, --token <token>`: API token
  - `--wait`: Wait for server to stop
- `reboot <serverSlug>`: Reboot a server
  - `-t, --token <token>`: API token
  - `--wait`: Wait for server to reboot
- `uncancel <serverSlug>`: Cancel a scheduled server deletion
  - `-t, --token <token>`: API token
- `reinstall <serverSlug> <imageSlug>`: Reinstall a server
  - `-t, --token <token>`: API token
  - `--userScriptId <id>`: "Optional user/account script ID. Retrieve it via GET /account/scripts or from the Scripts page in the dashboard. If provided, the script is deployed to
    /root/auto-deploy-script and executed once provisioning finishes (after all provisioning actions, including SSL certificate generation). The script is executed from the command line; ensure it has
    a valid shebang (e.g. #!/bin/bash, #!/usr/bin/env python3) and is self-contained. Use this to auto-deploy software, credentials, or other setup steps."
  - `--wait`: Wait for reinstall
- `resize <serverSlug> <profileSlug>`: Resize a server (change profile)
  - `-t, --token <token>`: API token
  - `--wait`: Wait for resize
- `resize-dryrun <serverSlug> <profile>`: Preview server profile change
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `metrics <serverSlug>`: Get instant server metrics
  - `-t, --token <token>`: API token
  - `--now`: Get metrics now
- `archive <slug>`: Archive a server
  - `-t, --token <token>`: API token
  - `-f, --force`: Force archive
  - `--wait`: Wait for completion
  - `--json`, `--csv`
- `fetch-file <slug> <path>`: Fetch a file from a server
  - `-t, --token <token>`: API token
  - `--wait`: Wait for completion
- `identity update <serverSlug>`: Update the server identity including the main domain and alias domains
  - `-t, --token <token>`: API token
  - `--maindomain <maindomain>`: Main domain for the server
  - `--aliasdomains <aliasdomains>`: Alias domains for the server, comma-separated or newline-separated
  - `--removeDefaultAlias <removeDefaultAlias>`: Remove the default Webdock alias from DNS (default: true)
  - `--wait`: Wait for completion
- `settings update <serverSlug>`: Update server settings
  - `-t, --token <token>`: API token
  - `--webroot <webroot>`: New web root path on the server
  - `--updateWebserver <updateWebserver>`: Update web server configuration when setting the web root (default: true)
  - `--updateLetsencrypt <updateLetsencrypt>`: Update Let's Encrypt configuration when setting the web root (default: true)
  - `--wait`: Wait for completion
- `ssl update <serverSlug>`: Renew SSL certificates for a server
  - `-t, --token <token>`: API token
  - `--domains <domains>`: Domains to include in the certificate, comma-separated or newline-separated
  - `--email <email>`: Email address for certificate notifications
  - `--forceSSL <forceSSL>`: Enforce SSL/TLS configuration for the renewed domains (default: true)
  - `--wait`: Wait for completion

---

## `shellusers`

**Manage server shell users.**

### Subcommands:

- `list <slug>`: List shell users for a server
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `create <slug> <username> <password>`: Create a shell user
  - `-t, --token <token>`: API token
  - `--wait`: Wait for completion
  - `-s, --shell <shell>`: Shell (default: /bin/bash)
  - `-g, --group <group>`: Group (default: sudo)
  - `-k, --public-keys <keys>`: Public key IDs (comma-separated)
  - `--json`, `--csv`
- `delete <slug> <id>`: Delete a shell user
  - `-t, --token <token>`: API token
  - `-f, --force`: Force deletion
  - `--wait`: Wait for completion
- `update <slug> <id>`: Update a shell user's public keys
  - `-t, --token <token>`: API token
  - `--wait`: Wait for completion
  - `-k, --public-keys <keys>`: Public key IDs (comma-separated)
  - `--json`, `--csv`
- `webssh-token <serverSlug> <username>`: Generate a WebSSH token for a shell user
  - `-t, --token <token>`: API token
  - `--json`: Output as JSON

---

## `snapshots`

**Manage server snapshots.**

### Subcommands:

- `list <serverSlug>`: List all snapshots for a server
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `create <serverSlug> <name>`: Create a snapshot for a server
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
  - `--wait`: Wait for completion
- `delete <serverSlug> <snapshotId>`: Delete a snapshot
  - `-t, --token <token>`: API token
  - `--wait`: Wait for completion
- `restore <serverSlug> <snapshotId>`: Restore a server from a snapshot
  - `-t, --token <token>`: API token
  - `--wait`: Wait for completion

---

## `sshkeys`

**Manage SSH keys.**

### Subcommands:

- `list`: List all SSH keys
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `create <name> <key>`: Add a new SSH key
  - `-t, --token <token>`: API token
  - `--json`, `--csv`
- `delete <id>`: Delete an SSH key
  - `-t, --token <token>`: API token

---

## `update`

**Check whether a newer version of the CLI is available.**

```
webdock update
```

- No additional flags are required

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue to report a bug or suggest a new feature.

<img src="assets/webdock-cli-logo.svg" alt="Webdock CLI Logo" style="width:100%;border-radius:10px">

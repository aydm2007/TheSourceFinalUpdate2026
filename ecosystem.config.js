module.exports = {
  apps: [
    {
      name: 'MCP-Remote-Server',
      script: 'mcp_remote_server.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        AETHER_PROVIDER: 'openrouter',
        AETHER_MODEL: 'openai/gpt-oss-120b:free'
      }
    },
    {
      name: 'Sovereign-Dashboard',
      script: 'core/dashboard/sovereign_dashboard.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        DASHBOARD_PORT: 3851
      }
    },
    {
      name: 'Visual-Cortex',
      script: 'nervous_system_server.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        START_NERVOUS_SYSTEM: 'true'
      }
    },
    {
      name: 'Deputy',
      script: 'tools/deputy.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M'
    },
    {
      name: 'Slack-Notifier',
      script: 'tools/slack_notifier.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M'
    },
    {
      name: 'Slack-Bridge',
      script: 'tools/slack_bridge.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M'
    },
    {
      name: 'Chess-Engine-3D',
      script: 'ChessEngine/server.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3855
      }
    },
    {
      name: 'Chat-Backend',
      script: 'node_modules/ts-node/dist/bin.js',
      args: 'src/server.ts',
      cwd: __dirname + '/chat-backend',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      }
    },
    {
      name: 'Chat-Frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host',
      cwd: __dirname + '/chat-frontend',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};

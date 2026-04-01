module.exports = {
  apps: [
    {
      name: "dentflow",
      script: "npm",
      args: "run start",
      cwd: "/var/www/dentflow",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};

import { createApp } from './app.js';

async function bootstrap() {
  const { app, config, ollamaClient } = await createApp();

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`\n======================================================`);
    console.log(`   PIAGENT — Centralized Agent Infrastructure Plane   `);
    console.log(`======================================================`);
    console.log(`Service URL : http://${config.host}:${config.port}`);
    console.log(`Ollama URL  : ${config.ollamaBaseUrl}`);
    console.log(`MCP Gateway : ${config.mcpServerUrl}`);
    console.log(`Agents DB   : ${config.agentsFilePath}\n`);

    const ollamaOk = await ollamaClient.isHealthy();
    console.log(`Ollama Status : ${ollamaOk ? 'Connected (online)' : 'Disconnected (offline / start with: ollama serve)'}`);
  } catch (err) {
    console.error('Failed to start piagent server:', err);
    process.exit(1);
  }
}

bootstrap();

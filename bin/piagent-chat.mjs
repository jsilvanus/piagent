#!/usr/bin/env node
import { runTerminalChat } from '../dist/cli/chat.js';

runTerminalChat().catch(err => {
  console.error('Terminal chat error:', err);
  process.exit(1);
});

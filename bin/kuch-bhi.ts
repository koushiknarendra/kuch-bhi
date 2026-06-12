#!/usr/bin/env node
import { Command } from 'commander';
import { connectCommand } from '../src/commands/connect.js';
import { orderCommand } from '../src/commands/order.js';
import { placeCommand } from '../src/commands/place.js';

const program = new Command();

program
  .name('kuch-bhi')
  .description('Autonomous food ordering agent for Swiggy and Zomato')
  .version('1.0.0');

program
  .command('connect <platform>')
  .description('Authorize with Swiggy or Zomato (run once per platform)')
  .action(async (platform: string) => {
    if (platform !== 'swiggy' && platform !== 'zomato') {
      console.error('Error: platform must be "swiggy" or "zomato"');
      process.exit(1);
    }
    try {
      await connectCommand(platform);
    } catch (err) {
      console.error(`\nConnect failed: ${String(err)}`);
      process.exit(1);
    }
  });

program
  .command('suggest')
  .description('Research both platforms and output ranked suggestions as JSON (used by /kuch-bhi slash command)')
  .action(async () => {
    try {
      await orderCommand('suggest');
    } catch (err) {
      process.stderr.write(`Suggest failed: ${String(err)}\n`);
      process.exit(1);
    }
  });

program
  .command('place <suggestionJson>')
  .description('Place an order for a pre-selected suggestion (JSON string from suggest output)')
  .action(async (suggestionJson: string) => {
    try {
      await placeCommand(suggestionJson);
    } catch (err) {
      console.error(`\nPlace failed: ${String(err)}`);
      process.exit(1);
    }
  });

// Default — interactive mode with readline
program.action(async () => {
  try {
    await orderCommand('interactive');
  } catch (err) {
    console.error(`\nFailed: ${String(err)}`);
    process.exit(1);
  }
});

program.parseAsync(process.argv);

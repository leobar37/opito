/**
 * Logger utility with colors
 */
import pc from 'picocolors';
import type { LogLevel } from '../types/index.js';

const ICONS: Record<LogLevel, string> = {
  info: 'ℹ️',
  success: '✓',
  warning: '⚠️',
  error: '✗',
  debug: '🐛',
};

const COLORS: Record<LogLevel, (text: string) => string> = {
  info: pc.blue,
  success: pc.green,
  warning: pc.yellow,
  error: pc.red,
  debug: pc.gray,
};

class Logger {
  private verbose = false;

  setVerbose(value: boolean): void {
    this.verbose = value;
  }

  log(level: LogLevel, message: string): void {
    if (level === 'debug' && !this.verbose) return;
    
    const icon = ICONS[level];
    const color = COLORS[level];
    console.log(`${icon} ${color(message)}`);
  }

  info(message: string): void {
    this.log('info', message);
  }

  success(message: string): void {
    this.log('success', message);
  }

  warning(message: string): void {
    this.log('warning', message);
  }

  error(message: string): void {
    this.log('error', message);
  }

  debug(message: string): void {
    this.log('debug', message);
  }

  // Print sync report
  report(results: { total: number; created: number; updated: number; errors: number }): void {
    console.log('');
    console.log(pc.bold('📊 Sync Report'));
    console.log(pc.gray('─'.repeat(40)));
    console.log(`${pc.blue('Total:')}     ${results.total}`);
    console.log(`${pc.green('Created:')}   ${results.created}`);
    console.log(`${pc.yellow('Updated:')}   ${results.updated}`);
    console.log(`${pc.red('Errors:')}    ${results.errors}`);
    console.log(pc.gray('─'.repeat(40)));
  }

  // Print list table
  table(headers: string[], rows: string[][]): void {
    const colWidths = headers.map((h, i) => 
      Math.max(h.length, ...rows.map(r => r[i]?.length || 0)) + 2
    );

    // Header
    const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join('');
    console.log(pc.bold(headerLine));
    console.log(pc.gray('─'.repeat(colWidths.reduce((a, b) => a + b, 0))));

    // Rows
    for (const row of rows) {
      const line = row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join('');
      console.log(line);
    }
  }
}

export const logger = new Logger();

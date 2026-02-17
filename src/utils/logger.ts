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

  report(results: { total: number; created: number; updated: number; errors: number }): void {
    this.newline();
    this.raw(pc.bold('📊 Sync Report'));
    this.raw(pc.gray('─'.repeat(40)));
    this.raw(`${pc.blue('Total:')}     ${results.total}`);
    this.raw(`${pc.green('Created:')}   ${results.created}`);
    this.raw(`${pc.yellow('Updated:')}   ${results.updated}`);
    this.raw(`${pc.red('Errors:')}    ${results.errors}`);
    this.raw(pc.gray('─'.repeat(40)));
  }

  table(headers: string[], rows: string[][]): void {
    const colWidths = headers.map((h, i) => 
      Math.max(h.length, ...rows.map(r => this.stripAnsi(r[i] || '').length)) + 2
    );

    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const headerLine = headers.map((h, i) => {
      const width = colWidths[i] ?? h.length + 2;
      return pc.bold(h).padEnd(width + 8);
    }).join('');
    console.log(headerLine);
    console.log(pc.gray('─'.repeat(totalWidth)));

    for (const row of rows) {
      const line = row.map((cell, i) => {
        const visibleLength = this.stripAnsi(cell || '').length;
        const width = colWidths[i] ?? visibleLength + 2;
        const padding = width - visibleLength;
        return (cell || '') + ' '.repeat(Math.max(0, padding));
      }).join('');
      console.log(line);
    }
  }

  raw(message: string): void {
    console.log(message);
  }

  newline(): void {
    console.log('');
  }

  json(data: unknown, indent: number = 2): void {
    console.log(JSON.stringify(data, null, indent));
  }

  private stripAnsi(str: string): string {
    return str.replace(/\u001b\[[0-9;]*m/g, '');
  }
}

export const logger = new Logger();

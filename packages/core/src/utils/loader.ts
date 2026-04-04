import { Spinner } from 'picospinner';

export class Loader {
  private spinner: Spinner | null = null;

  start(text: string): void {
    this.spinner = new Spinner(text);
    this.spinner.start();
  }

  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  warn(text?: string): void {
    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    }
  }

  info(text?: string): void {
    if (this.spinner) {
      this.spinner.info(text);
      this.spinner = null;
    }
  }

  update(text: string): void {
    if (this.spinner) {
      this.spinner.setText(text);
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

export async function withLoader<T>(
  text: string,
  fn: () => Promise<T>,
  successText?: string
): Promise<T> {
  const loader = new Loader();
  loader.start(text);

  try {
    const result = await fn();
    loader.succeed(successText || text);
    return result;
  } catch (error) {
    loader.fail(error instanceof Error ? error.message : 'Failed');
    throw error;
  }
}

export const loader = new Loader();

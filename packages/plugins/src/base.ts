export interface Plugin {
  name: string;
  version: string;
  
  beforeSync?(ctx: { commands: string[] }): Promise<void>;
  afterSync?(ctx: { commands: string[]; results: unknown[] }): Promise<void>;
}

export abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract version: string;
  
  async beforeSync?(): Promise<void> {}
  async afterSync?(): Promise<void> {}
}

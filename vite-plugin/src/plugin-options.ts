export interface MoruEntries {
  suffix: string;
  include: Array<string>;
  exclude: Array<string>;
}

export interface PluginOptions {
  entries: MoruEntries;
}

export interface Config {
    port: number;
    host: string;
    ollamaBaseUrl: string;
    defaultModel: string;
    mcpServerUrl: string;
    storageDir: string;
    agentsFilePath: string;
}
export declare function loadConfig(): Config;

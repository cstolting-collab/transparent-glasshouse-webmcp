type WebMCPTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
};

type WebMCPRegisterOptions = {
  signal?: AbortSignal;
};

interface WebMCPModelContext {
  registerTool(
    tool: WebMCPTool,
    options?: WebMCPRegisterOptions,
  ): Promise<void>;
}

declare global {
  interface Document {
    modelContext?: WebMCPModelContext;
  }
}

export {};

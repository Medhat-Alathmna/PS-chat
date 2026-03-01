import { formatCacheUsage } from "./cache";

/**
 * Shared streaming callbacks for onStepFinish / onFinish logging.
 * Use `logToolResults: true` for routes that also want toolResultsCount.
 */
export function makeStreamingCallbacks(prefix: string, opts?: { logToolResults?: boolean }) {
  return {
    onStepFinish: ({ toolCalls, toolResults }: any) => {
      if (toolCalls?.length) {
        for (const call of toolCalls) {
          const result = toolResults?.find((r: any) => r.toolCallId === call.toolCallId);
          console.log(`[${prefix}] Tool call`, {
            tool: call.toolName,
            args: call.args,
            result: result?.result,
          });
        }
      }
    },
    onFinish: async ({ text, toolCalls, toolResults, usage }: any) => {
      const cache = formatCacheUsage(usage as Record<string, unknown>);
      console.log(`[${prefix}] Stream finished`, {
        textLength: text.length,
        toolCallsCount: toolCalls?.length || 0,
        ...(opts?.logToolResults && { toolResultsCount: toolResults?.length || 0 }),
        ...(cache && { cache }),
      });
    },
  };
}

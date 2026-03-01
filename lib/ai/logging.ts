import { formatCacheUsage } from "./cache";

/**
 * Shared streaming callbacks for onStepFinish / onFinish logging.
 * Use `logToolResults: true` for routes that also want toolResultsCount.
 */
export function makeStreamingCallbacks(prefix: string, opts?: { logToolResults?: boolean }) {
  return {
    onStepFinish: ({ toolCalls, toolResults }: { toolCalls?: { toolCallId: string; toolName: string; args: unknown }[]; toolResults?: { toolCallId: string; result: unknown }[] }) => {
      if (toolCalls?.length) {
        const resultMap = new Map(toolResults?.map((r) => [r.toolCallId, r.result]));
        for (const call of toolCalls) {
          console.log(`[${prefix}] Tool call`, {
            tool: call.toolName,
            args: call.args,
            result: resultMap.get(call.toolCallId),
          });
        }
      }
    },
    onFinish: ({ text, toolCalls, toolResults, usage }: { text: string; toolCalls?: unknown[]; toolResults?: unknown[]; usage: Record<string, unknown> }) => {
      const cache = formatCacheUsage(usage);
      console.log(`[${prefix}] Stream finished`, {
        textLength: text.length,
        toolCallsCount: toolCalls?.length || 0,
        ...(opts?.logToolResults && { toolResultsCount: toolResults?.length || 0 }),
        ...(cache && { cache }),
      });
    },
  };
}

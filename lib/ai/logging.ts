import { formatCacheUsage } from "./cache";

/**
 * Shared streaming callbacks for onStepFinish / onFinish logging.
 * Use `logToolResults: true` for routes that also want toolResultsCount.
 */
export function makeStreamingCallbacks(prefix: string, opts?: { logToolResults?: boolean }) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onStepFinish: ({ toolCalls, toolResults }: any) => {
      if (toolCalls?.length) {
        const resultMap = new Map((toolResults ?? []).map((r: any) => [r.toolCallId, r.result]));
        for (const call of toolCalls) {
          console.log(`[${prefix}] Tool call`, {
            tool: call.toolName,
            args: call.input ?? call.args,
            result: resultMap.get(call.toolCallId),
          });
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFinish: ({ text, toolCalls, toolResults, usage }: any) => {
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

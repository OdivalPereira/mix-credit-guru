import { optimizePerItem, type OptimizePerItemInput } from "@/lib/opt";

self.onmessage = (e: MessageEvent<OptimizePerItemInput>) => {
  const input = e.data;
  const result = optimizePerItem(input, (percent) => {
    self.postMessage({ type: "progress", value: percent });
  });
  self.postMessage({ type: "result", result });
};

export {};

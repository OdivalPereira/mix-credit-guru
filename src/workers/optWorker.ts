import { optimizePerItem, type OptimizePerItemInput } from "@/lib/opt";

self.onmessage = (e: MessageEvent<OptimizePerItemInput>) => {
  const input = e.data;
  let latestProgress = 0;

  const sendProgress = (value: number) => {
    latestProgress = Math.max(0, Math.min(100, value));
    self.postMessage({ type: "progress", value: latestProgress });
  };

  sendProgress(0);

  const progressInterval = setInterval(() => {
    self.postMessage({ type: "progress", value: latestProgress });
  }, 500);

  try {
    const result = optimizePerItem(input, (percent) => {
      sendProgress(percent);
    });

    sendProgress(100);
    self.postMessage({ type: "result", result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao otimizar.";
    self.postMessage({ type: "error", message });
  } finally {
    clearInterval(progressInterval);
  }
};

export {};

// vite.config.ts
import { defineConfig } from "file:///C:/Users/contabil/Documents/Projetos%20Antigravity/mix-credit-guru/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/contabil/Documents/Projetos%20Antigravity/mix-credit-guru/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/contabil/Documents/Projetos%20Antigravity/mix-credit-guru/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\contabil\\Documents\\Projetos Antigravity\\mix-credit-guru";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "src/**/__tests__/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx}"
    ],
    exclude: ["node_modules/**", "tests/e2e/**"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxjb250YWJpbFxcXFxEb2N1bWVudHNcXFxcUHJvamV0b3MgQW50aWdyYXZpdHlcXFxcbWl4LWNyZWRpdC1ndXJ1XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxjb250YWJpbFxcXFxEb2N1bWVudHNcXFxcUHJvamV0b3MgQW50aWdyYXZpdHlcXFxcbWl4LWNyZWRpdC1ndXJ1XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9jb250YWJpbC9Eb2N1bWVudHMvUHJvamV0b3MlMjBBbnRpZ3Jhdml0eS9taXgtY3JlZGl0LWd1cnUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHRlc3Q6IHtcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxyXG4gICAgc2V0dXBGaWxlczogW1wiLi9zcmMvdGVzdC9zZXR1cC50c1wiXSxcclxuICAgIGluY2x1ZGU6IFtcclxuICAgICAgXCJzcmMvKiovKi57dGVzdCxzcGVjfS57dHMsdHN4fVwiLFxyXG4gICAgICBcInNyYy8qKi9fX3Rlc3RzX18vKiovKi57dGVzdCxzcGVjfS57dHMsdHN4fVwiLFxyXG4gICAgICBcInRlc3RzL3VuaXQvKiovKi57dGVzdCxzcGVjfS57dHMsdHN4fVwiLFxyXG4gICAgICBcInRlc3RzL2ludGVncmF0aW9uLyoqLyoue3Rlc3Qsc3BlY30ue3RzLHRzeH1cIixcclxuICAgIF0sXHJcbiAgICBleGNsdWRlOiBbXCJub2RlX21vZHVsZXMvKipcIiwgXCJ0ZXN0cy9lMmUvKipcIl0sXHJcbiAgfVxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1ksU0FBUyxvQkFBb0I7QUFDN1osT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDOUUsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLHFCQUFxQjtBQUFBLElBQ2xDLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUyxDQUFDLG1CQUFtQixjQUFjO0FBQUEsRUFDN0M7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=

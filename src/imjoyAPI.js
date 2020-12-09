export async function setupImJoyAPI({ createWindow, updateConfig }) {
  const imjoyRPC = await window.imjoyLoader.loadImJoyRPC({
    api_version: "0.2.3"
  });

  const api = await imjoyRPC.setupRPC({
    name: "ImJoyGrid",
    version: "0.1.0",
    description: "A draggable, resizable grid container for ImJoy windows",
    type: "rpc-window"
  });

  const service_api = {
    setup() {
      api.log("ImJoyGrid loaded successfully.");
    },
    run(ctx) {
      if (ctx.config) {
        updateConfig(ctx.config);
      }
    },
    createWindow
  };
  api.export(service_api);
  return api;
}

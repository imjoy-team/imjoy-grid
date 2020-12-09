import { reshape } from "mathjs";

const itkVtkViewer = window.itkVtkViewer;

const dtypeToTypedArray = {
  int8: "Int8Array",
  int16: "Int16Array",
  int32: "Int32Array",
  uint8: "Uint8Array",
  uint16: "Uint16Array",
  uint32: "Uint32Array",
  float32: "Float32Array",
  float64: "Float64Array",
  array: "Array"
};

const ArrayBufferView = Object.getPrototypeOf(
  Object.getPrototypeOf(new Uint8Array())
).constructor;

function toArray(data) {
  if (
    typeof data === "number" ||
    typeof data === "string" ||
    typeof data === "boolean" ||
    data === null ||
    data === undefined
  ) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return Array.from(new Uint8Array(data));
  }
  if (data instanceof ArrayBufferView) {
    return Array.from(data);
  }
  if (Array.isArray(data)) return data.map(toArray);
  if (data.constructor === Object) {
    if (data._rtype) {
      if (data._rtype !== "ndarray") throw "Invalid input type: " + data._rtype;
      const arraytype = eval(dtypeToTypedArray[data._rdtype]);
      return reshape(Array.from(new arraytype(data._rvalue)), data._rshape);
    }
    const obj = {};
    Object.entries(data).forEach(arr => {
      obj[arr[0]] = toArray(arr[1]);
    });
    return obj;
  } else {
    throw new Error("Unsupported type conversion");
  }
}

export async function setupImJoyAPI({}) {
  
  const imjoyRPC = await window.imjoyLoader.loadImJoyRPC({
    api_version: "0.2.3"
  });

  const api = await imjoyRPC.setupRPC({
    name: "ImJoyGrid",
    version: "0.1.0",
    description:
      "A draggable, resizable grid container for ImJoy windows",
    type: "rpc-window"
  });

  const service_api = {
    setup() {
      api.log("ImJoyGrid loaded successfully.");
    },
    async run(ctx) {
     
    },
  };
  api.export(service_api);
}

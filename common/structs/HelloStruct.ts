import { MessageKind } from "../types";
import { allocUint8Field, allocUint32Field, allocFloat32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const HelloStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const id = allocUint32Field(allocator);
  const x = allocFloat32Field(allocator);
  const y = allocFloat32Field(allocator);
  const direction = allocFloat32Field(allocator);
  const hue = allocUint8Field(allocator);
  const size = allocator.size;
  const verify = verifier(kind, MessageKind.Hello, size);
  return { kind, id, x, y, direction, hue, size, verify };
})();

export default HelloStruct;

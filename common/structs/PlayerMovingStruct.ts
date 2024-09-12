import { MessageKind } from "../types";
import { allocUint8Field, allocUint32Field, allocFloat32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const PlayerMovingStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const direction = allocUint8Field(allocator);
  const start = allocUint8Field(allocator);
  const size = allocator.size;
  const verify = verifier(kind, MessageKind.PlayerMoving, size);
  return { kind, direction, start, size, verify }
})()

export default PlayerMovingStruct;

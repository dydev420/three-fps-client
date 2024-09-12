import { MessageKind } from "../types";
import { allocUint8Field, allocUint32Field, allocFloat32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const PlayerStruct = (() => {
  const allocator = { size: 0 };
  const id = allocUint32Field(allocator);
  const x = allocFloat32Field(allocator);
  const y = allocFloat32Field(allocator);
  const hue = allocUint8Field(allocator);
  const direction = allocFloat32Field(allocator);
  const moving = allocUint8Field(allocator);
  const size = allocator.size;
  return { id, x, y, hue, direction, moving, size };
})();

export default PlayerStruct;

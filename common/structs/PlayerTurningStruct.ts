import { MessageKind } from "../types";
import { allocUint8Field, allocFloat32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const PlayerTurningStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const direction = allocFloat32Field(allocator);
  const size = allocator.size;
  const verify = verifier(kind, MessageKind.PlayerTurning, size);
  return { kind, direction, size, verify }
})();

export default PlayerTurningStruct;

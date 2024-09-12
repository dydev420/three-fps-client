import { MessageKind } from "../types";
import { allocUint8Field, allocUint32Field, allocFloat32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const PlayerLeftStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const id = allocUint32Field(allocator);
  const size = allocator.size;
  const verify = verifier(kind, MessageKind.PlayerLeft, size);
  return { kind, id, size, verify };
})();

export default PlayerLeftStruct;

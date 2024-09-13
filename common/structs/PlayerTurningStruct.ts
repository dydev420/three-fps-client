import { MessageKind } from "../types";
import { allocUint8Field, allocFloat32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const PlayerTurningStruct = (() => {
  const allocator = { size: 0 };
  const fields = {
    kind : allocUint8Field(allocator),
    direction: allocFloat32Field(allocator),
    seqId: allocUint8Field(allocator),
  };
  type Props = keyof typeof fields;  
  const helpers = {
    verify: verifier(fields.kind, MessageKind.PlayerTurning, allocator.size),
    write: writer(fields) as (view : DataView, props: {[key in Props]: number}) => void,
    read: reader(fields) as (view : DataView) => {[key in Props]: number},
  };
  return {
    ...fields,
    ...helpers,
    size: allocator.size,
  };
})();

export default PlayerTurningStruct;

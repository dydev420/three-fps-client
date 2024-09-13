import { MessageKind } from "../types";
import { allocUint8Field, allocUint32Field, allocFloat32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const PlayerMovingStruct = (() => {
  const allocator = { size: 0 };
  const fields = {
    kind: allocUint8Field(allocator),
    direction: allocUint8Field(allocator),
    start: allocUint8Field(allocator),
    seqId: allocUint8Field(allocator),
  };
  type Props = keyof typeof fields;  
  const helpers = {
    verify: verifier(fields.kind, MessageKind.PlayerMoving, allocator.size),
    write: writer(fields) as (view : DataView, props: {[key in Props]: number}) => void,
    read: reader(fields) as (view : DataView) => {[key in Props]: number},
  };
  return {
    ...fields,
    ...helpers,
    size: allocator.size,
  };
})()

export default PlayerMovingStruct;

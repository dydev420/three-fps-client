import { MessageKind } from "../types";
import { allocUint8Field, allocUint32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const PingPongStruct = (() => {
  const allocator = { size: 0 };
  const fields = {
    kind : allocUint8Field(allocator),
    timestamp : allocUint32Field(allocator),
  };
  type Props = keyof typeof fields;  
  const helpers = {
    verifyPing: verifier(fields.kind, MessageKind.Ping, allocator.size),
    verifyPong: verifier(fields.kind, MessageKind.Pong, allocator.size),
    write: writer(fields) as (view : DataView, props: {[key in Props]: number}) => void,
    read: reader(fields) as (view : DataView) => {[key in Props]: number},
  };
  return {
    ...fields,
    ...helpers,
    size: allocator.size,
  };
})();

export default PingPongStruct;

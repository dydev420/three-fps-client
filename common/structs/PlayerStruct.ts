import { MessageKind } from "../types";
import { allocUint8Field, allocUint32Field, allocFloat32Field } from "../helpers/allocators";
import { verifier, writer, reader } from "../helpers/structs";

const PlayerStruct = (() => {
  const allocator = { size: 0 };
  const fields = {
    kind: allocUint8Field(allocator),
    id: allocUint32Field(allocator),
    x: allocFloat32Field(allocator),
    y: allocFloat32Field(allocator),
    direction: allocFloat32Field(allocator),
    hue: allocUint8Field(allocator),
    moving: allocUint8Field(allocator),
  };
  type Props = keyof typeof fields;  
  const helpers = {
    write: writer(fields) as (view : DataView, props: {[key in Props]: number}) => void,
    read: reader(fields) as (view : DataView) => {[key in Props]: number},
  };
  return {
    ...fields,
    ...helpers,
    size: allocator.size,
  };
})();

export default PlayerStruct;

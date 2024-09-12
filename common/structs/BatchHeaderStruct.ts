import { MessageKind } from "../types";
import { allocUint8Field, allocUint16Field } from "../helpers/allocators";
import PlayerStruct from "./PlayerStruct";
import { reader, writer } from "../helpers/structs";

const BatchHeaderStruct = (() => {
  const allocator = { size: 0 };
  const fields = {
    kind : allocUint8Field(allocator),
    count: allocUint16Field(allocator),
  };
  type Props = keyof typeof fields;  
  const helpers = {
    verifyMoved: (view: DataView) => {
      return view.byteLength >= allocator.size
        && (view.byteLength - allocator.size) % PlayerStruct.size === 0
        && fields.kind.read(view) === MessageKind.PlayerMoved
    },
    verifyJoined: (view: DataView) => {
      return view.byteLength >= allocator.size
        && (view.byteLength - allocator.size) % PlayerStruct.size === 0
        && fields.kind.read(view) === MessageKind.PlayerJoined
    },
    write: writer(fields) as (view : DataView, props: {[key in Props]: number}) => void,
    read: reader(fields) as (view : DataView) => {[key in Props]: number},
  };
  return {
    ...fields,
    ...helpers,
    size: allocator.size,
  };
})();

export default BatchHeaderStruct;

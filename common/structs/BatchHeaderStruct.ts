import { MessageKind } from "../types";
import { allocUint8Field, allocUint16Field } from "../helpers/allocators";
import PlayerStruct from "./PlayerStruct";

const BatchHeaderStruct = (() => {
  const allocator = { size: 0 };
  const kind = allocUint8Field(allocator);
  const count = allocUint16Field(allocator);
  const size = allocator.size;
  const verifyMoved = (view: DataView) => {
    return view.byteLength >= size
      && (view.byteLength - size) % PlayerStruct.size === 0
      && kind.read(view) === MessageKind.PlayerMoved
  };
  const verifyJoined = (view: DataView) => {
    return view.byteLength >= size
      && (view.byteLength - size) % PlayerStruct.size === 0
      && kind.read(view) === MessageKind.PlayerJoined
  };
  return {kind, count, size, verifyMoved, verifyJoined };
})();

export default BatchHeaderStruct;

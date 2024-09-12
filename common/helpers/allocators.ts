import {
  UINT8_SIZE,
  UINT16_SIZE,
  UINT32_SIZE,
  FLOAT32_SIZE,
} from '../helpers/constants';
import { Field } from '../types';

export function allocUint8Field(allocator: { size: number }): Field {
  const offset = allocator.size;
  const size = UINT8_SIZE;
  allocator.size += size;
  return {
    offset,
    size,
    read: (view) => view.getUint8(offset),
    write: (view, value) => view.setUint8(offset, value),
  };
}

export function allocUint16Field(allocator: { size: number }): Field {
  const offset = allocator.size;
  const size = UINT16_SIZE;
  allocator.size += size;
  return {
    offset,
    size,
    read: (view) => view.getUint16(offset),
    write: (view, value) => view.setUint16(offset, value),
  };
}

export function allocUint32Field(allocator: { size: number }): Field {
  const offset = allocator.size;
  const size = UINT32_SIZE;
  allocator.size += size;
  return {
    offset,
    size,
    read: (view) => view.getUint32(offset, true),
    write: (view, value) => view.setUint32(offset, value, true),
  };
}

export function allocFloat32Field(allocator: { size: number }): Field {
  const offset = allocator.size;
  const size = FLOAT32_SIZE;
  allocator.size += size;
  return {
    offset,
    size,
    read: (view) => view.getFloat32(offset, true),
    write: (view, value) => view.setFloat32(offset, value, true),
  };
}

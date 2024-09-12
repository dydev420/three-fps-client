import { Field } from '../types';

export function verifier(kindField: Field, kind: number, size: number ): (view: DataView) => boolean {
  return (view: DataView) => view.byteLength === size && kindField.read(view) === kind;
} 

export function writer(fields: {[key: string]: Field}) {
  return (view : DataView, props: {[key: string]: number}) => {
    for (const [key, value] of Object.entries(props)) {
      if(fields[key]) {
        fields[key].write(view, props[key]);
      }
    }
  };
}

export function reader(fields: {[key: string]: Field}) {
  return (view : DataView,) => {
    const props: {[x: string]: number | undefined} = {};
    for (const key of Object.keys(fields)) {
      if(fields[key]) {
        props[key] = fields[key].read(view);
      } else {
        props[key] = undefined;
      }
    }
    return props;
  };
}

import * as StreamX from "streamx";

export type ReadableOptions<S extends Readable<O>, O> = Omit<StreamX.ReadableOptions<S>, 'mapReadable' | 'map'>;
export type DuplexOptions<S extends Duplex<I,O>, I, O> = Omit<StreamX.DuplexOptions<S>, 'mapReadable' | 'mapWritable' | 'map'>;

export type WritableOptions<S extends Writable<O>, O> = Omit<StreamX.WritableOptions<S>, 'mapWritable' | 'map' | 'write' | 'writev'> & {
  write?(this: S, data: O, cb: (err: Error | null) => void): void
  writev?(this: S, batch: O[], cb: (err: Error | null) => void): void
};

export type TransformOptions<S extends Transform<I,O>, I, O> = Omit<StreamX.TransformOptions<S>, 'map' | 'mapReadable' | 'mapWritable' | 'map' | 'transform'> & {
    transform?(this: S, data: I, cb:  (err: Error | null, mappedData: O) => void): void
}

export type TypedReadableEvents<DataType> = StreamX.ReadableEvents & {
    data: [data: DataType]
}

export type TypedTransformEvents<InputType, OutputType> = StreamX.TransformEvents & {
    data:[data: OutputType]
} 

export type TypedDuplexEvents<InputType, OutputType> = StreamX.DuplexEvents & TypedReadableEvents<InputType> & StreamX.WritableEvents;

export class Readable<
  Output,
  ReadableEvents extends TypedReadableEvents<Output> = TypedReadableEvents<Output>,
> extends StreamX.Readable<ReadableEvents> {
  constructor(options: ReadableOptions<Readable<Output>, Output>) {
    super(options);
  }

  push(data: Output | null): boolean {
    return super.push(data);
  }

  unshift(data: Output | null): void {
    return super.unshift(data);
  }

  read(): Output | null {
    return super.read() as Output;
  }

  pipeT<TransformOut>(
    dest: Transform<Output, TransformOut>,
    drainedCallback?: (err: Error | null) => void
  ): Transform<Output, TransformOut>;

  pipeT<DuplexOut>(
    dest: Duplex<Output, DuplexOut>,
    drainedCallback?: (err: Error | null) => void
  ): Duplex<Output, DuplexOut>

  pipeT(
    dest: Writable<Output>,
    drainedCallback?: (err: Error | null) => void,
  ): Writable<Output>;

  pipeT(dest: StreamX.Writable, drainedCallback?: (err: Error | null) => void) {
    return super.pipe(dest, drainedCallback)
  }
}

export  class Writable<
  Output,
  WritableEvents extends StreamX.WritableEvents = StreamX.WritableEvents,
> extends StreamX.Writable<WritableEvents> {
  constructor(options: WritableOptions<Writable<Output>, Output>) {
    super(options);
  }

  write(data: Output): boolean {
    return super.write(data);
  }
}

interface IDuplex<Input, Output, M extends TypedDuplexEvents<Input, Output>>
  extends Readable<Input, M>, Writable<Output, M> {}

export class Duplex<Input, Output, M extends TypedDuplexEvents<Input, Output> = TypedDuplexEvents<Input, Output>>
  extends StreamX.Duplex<M>
  implements IDuplex<Input, Output, M>
{
  constructor(duplexOptions: DuplexOptions<Duplex<Input, Output>, Input, Output>) {
    super(duplexOptions);
  }
    pipeT<DuplexOut>(dest: Duplex<Input, DuplexOut, TypedDuplexEvents<Input, Output>>, drainedCallback?: (err: Error | null) => void): Duplex<Input, DuplexOut, TypedDuplexEvents<Input, Output>>;
    pipeT<TransformOut>(dest: Transform<Input, TransformOut, TypedDuplexEvents<Input, Output>>, drainedCallback?: (err: Error | null) => void): Transform<Input, TransformOut, TypedDuplexEvents<Input, Output>>;

    pipeT(
        dest: Writable<Output>,
        drainedCallback?: (err: Error | null) => void,
    ): Writable<Output>;

    pipeT(dest: StreamX.Writable, drainedCallback?: (err: Error | null) => void) {
        return super.pipe(dest, drainedCallback)
    }

    unshift(data: Input | null): void {
        return super.unshift(data);
    }

    read(): Input | null {
        return super.read() as Input;
    }

    push(data: Input): boolean {
        return super.push(data)
    }

    write(data: Output): boolean {
        return super.write(data)
    }
}

export class Transform<
  Input,
  Output,
  M extends TypedDuplexEvents<Input, Output> = TypedDuplexEvents<Input, Output>,
> extends StreamX.Transform<M> implements IDuplex<Input, Output, M> {

  constructor(opts: TransformOptions<Transform<Input, Output>, Input, Output>) {
    super(opts);
  }
    pipeT<DuplexOut>(dest: Duplex<Input, DuplexOut, TypedDuplexEvents<Input, Output>>, drainedCallback?: (err: Error | null) => void): Duplex<Input, DuplexOut, TypedDuplexEvents<Input, Output>>;
    pipeT<TransformOut>(dest: Transform<Input, TransformOut, TypedDuplexEvents<Input, Output>>, drainedCallback?: (err: Error | null) => void): Transform<Input, TransformOut, TypedDuplexEvents<Input, Output>>;

    pipeT(
        dest: Writable<Output>,
        drainedCallback?: (err: Error | null) => void,
    ): Writable<Output>;

    pipeT(dest: StreamX.Writable, drainedCallback?: (err: Error | null) => void) {
        return super.pipe(dest, drainedCallback)
    }

    unshift(data: Input | null): void {
        return super.unshift(data);
    }

    read(): Input | null {
        return super.read() as Input;
    }

    push(data: Input): boolean {
        return super.push(data)
    }

    write(data: Output): boolean {
        return super.write(data)
    }
}

let count = 0;

const testaroonie = 
    new Readable<number>({
        read(cb) {
            this.push(count)
            cb(null)

            if (++count > 5) {
                this.push(null);
            }
        }
    })
.pipeT<string>(new Transform<number, string>({
    transform(data, cb) {
        cb(null, (data * 2).toString())
    }
}))
//.pipeT(new Writable<number>({
//     write(data, cb) {
//         console.log(data)
//         cb(null)
//     }
// }))


testaroonie.on('data', (x) => {
    console.log("Got data: " + x)
})


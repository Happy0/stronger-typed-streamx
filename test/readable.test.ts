import { describe, test, expect } from "vitest";
import { Readable, Writable, Transform } from "../index";

describe("Readable class tests", () => {
  type Count = {
    count: number;
  };

  test("on 'data' event (read function as parameter)", async () => {
    let count = 1;
    const numbers: Array<number> = [];

    const readable = new Readable<Count>({
      read(cb) {
        this.push({
          count: count,
        });

        if (count === 10) {
          this.push(null);
        }

        count++;

        cb(null);
      },
    });

    readable.on("data", (d) => numbers.push(d.count));

    const result = await new Promise<Array<number>>((resolve, reject) => {
      readable.on("end", () => {
        resolve(numbers);
      });

      readable.on("error", (error) => reject(error));
    });

    expect(result).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("on 'data' event (subclass)", async () => {
    let count = 1;
    const numbers: Array<number> = [];

    class CountReader extends Readable<Count> {
      _read(cb: (err: Error | null) => void): void {
        this.push({
          count: count,
        });

        if (count === 10) {
          this.push(null);
        }

        count++;

        cb(null);
      }
    }

    const readable = new CountReader({});

    readable.on("data", (d) => numbers.push(d.count));

    const result = await new Promise<Array<number>>((resolve, reject) => {
      readable.on("end", () => {
        resolve(numbers);
      });

      readable.on("error", (error) => reject(error));
    });

    expect(result).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("Readable on external push", async () => {
    const readable = new Readable<Count>({});

    const numbers: Array<number> = [];

    const result = new Promise<Array<number>>((resolve, reject) => {
      readable.on('data', (num) => numbers.push(num.count));

      readable.on('end', () => resolve(numbers));
      readable.on('error', (err) => reject(err));
    })

    for (let i = 1; i < 11; i++) {
      readable.push({count: i});
    }

    readable.push(null);

    const numbersResult = await result;

    expect(numbersResult).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  })

  test("Readable piped to writable as expected", async () => {

    class CountReader extends Readable<number> {
      countUntilInclusive: number;
      count = 1;

      constructor(countUntilInclusive: number) {
        super({})
        this.countUntilInclusive = countUntilInclusive;
      }

      _read(cb: (err: Error | null) => void): void {
        
        this.push(this.count);

        if (this.count === 10) {
          this.push(null);
        }
        this.count++;

        cb(null)
      }
    }

    const numbers: Array<number> = [];
    const writer = new Writable<number>({
      write(data, cb) {
          numbers.push(data);
          cb(null);
      },
    });

    const stream = new CountReader(10).pipeT(writer);

    const result = await new Promise<Array<number>>((resolve, reject) => {
      stream.on('finish', () => {
        resolve(numbers)
      });

      stream.on('err', (err) => reject(err))
    })

    expect(result).toStrictEqual([1,2,3,4,5,6,7,8,9,10])
  })

  test("Readable piped to transformer and then writable as expected", async () => {

    class CountReader extends Readable<number> {
      countUntilInclusive: number;
      count = 1;

      constructor(countUntilInclusive: number) {
        super({})
        this.countUntilInclusive = countUntilInclusive;
      }

      _read(cb: (err: Error | null) => void): void {
        
        this.push(this.count);

        if (this.count === 10) {
          this.push(null);
        }
        this.count++;

        cb(null)
      }
    }

    const transformer = new Transform<number, number>({
      transform(data, cb) {
          cb(null, data * 2)
      },
    })


    const numbers: Array<number> = [];
    const writer = new Writable<number>({
      write(data, cb) {
          numbers.push(data);
          cb(null);
      },
    });

    const stream = new CountReader(10).pipeT(transformer).pipeT(writer);

    const result = await new Promise<Array<number>>((resolve, reject) => {
      stream.on('finish', () => {
        resolve(numbers)
      });

      stream.on('err', (err) => reject(err))
    })

    expect(result).toStrictEqual([1,2,3,4,5,6,7,8,9,10].map(num => num * 2))
  })

  test("Error event is emitted as expected", async () => {
    const readable = new Readable<string>({
      read (cb: (err: Error | null) => void) {
        cb(new Error("testaroonie"))
        
      }
    })

    const result = new Promise((resolve, reject) => {
      readable.on('data', (d) => resolve(d))
      readable.on('error', (err) => reject(err))
    })

    result
      .then(() => {throw new Error("Expected failure")})
      .catch((err) => {
        expect(err).toStrictEqual(new Error("testaroonie"))
      })
  })
});

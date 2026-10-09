import { describe, expect, test } from "vitest";
import { Readable, Transform, Writable } from "..";

describe("Transform", () => {

    type DiffStreamItem<T> = {
        prev: T | null,
        current: T
    };

    type DiffStreamWithTotal<T> = {
        count: number,
        item: DiffStreamItem<T>
    }

    function getDiffStreamTransform<T>(): Transform<T, DiffStreamWithTotal<T>> {

        let previous: T | null = null;

        const diffTransform = new Transform<T, DiffStreamItem<T>>({
            transform(data, cb) {

                cb(null, {
                    prev: previous,
                    current: data
                })

                previous = data;
            },
        })

        let count = 1;
        const countTransform = new Transform<DiffStreamItem<T>, DiffStreamWithTotal<T>>({
            transform(data, cb) {
                cb(null, {
                    item: data,
                    count: count
                })

                count++;
            },
        })

        const result = diffTransform.pipelineT(countTransform)

        return result;
    }


    test("Transform chain test", () => {
        const diffStreamTransform = getDiffStreamTransform<number>()

        const readable = new Readable<number>({});

        const stream = readable
            .pipeT(diffStreamTransform)
        
        const result: Array<DiffStreamWithTotal<number>> = [];
        stream.on('data', (event) => {
            result.push(event);
        })

        stream.write(1)
        stream.write(2)
        stream.write(3)
        stream.end(4);

        expect(result.length).toStrictEqual(3)


    });


});
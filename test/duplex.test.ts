import { Duplex, Transform, Writable } from "../index";
import { describe, test, expect } from "vitest";

describe("Duplex stream", () => {

    test("Read and write work as expected (constructor opts)", async () => {
        const strings: Array<string> = [];
        const numbers: Array<number> = [];

        const alphabet = 'abcdefghijklmnopqrstuvwxyz';

        let i = 0;

        const stream = new Duplex<string, number>({
            read(cb) {
                const currentLetter = alphabet[i];
                this.push(currentLetter || null);

                i++;
                cb(null);
            },
            write(data, cb) {
                numbers.push(data);
                cb(null);
            },
        })

        const finishPromise = new Promise((resolve, reject) => {
            stream.on('end', () => {resolve(null)})
            stream.on('error', (err) => {reject(err)})
        });
        
        stream.write(1)
        stream.write(2)
        stream.write(3)
        stream.end(4);

        stream.on('data', (d) => strings.push(d));

        await finishPromise;

        expect(numbers).toStrictEqual([1,2,3,4]);
        expect(strings).toStrictEqual(alphabet.split(''))
    })


})
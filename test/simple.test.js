import { expect } from '@open-wc/testing';

import {
    setupTurboProverAndVerifier
} from "../dest/index.js";

// import {
//     hello
// } from "../dest/main2.js";

// beforeAll(async () => {
    // prover = setupTurboProverAndVerifier();
    // verifier = createTurboPlonkStandardNoirVerifier();

    // circuit1 = await loadCircuit("circuit1");
    // For reference - circuit1/src/main.nr:
    // fn main(x : Field, y : pub Field) -> pub Field {
    //     constrain x != y;
    //     std::hash::pedersen([x])[0]
    // }

    // circuit2 = await loadCircuit("circuit2");
    // For reference - circuit2/src/main.nr:
    // fn main(x : Field, some_list : pub [Field; 2]) {
    //     for i in 0..2 {
    //         constrain x != some_list[i];
    //     }
    // }
// });

describe('MyElement', () => {
    it('can solve a valid circuit and inputs', async () => {

        expect(true).to.equal(true);
    });

});
import { Prover } from './client_proofs/index.js';
import { SinglePippenger } from './pippenger/index.js';

export class UltraProver {
  constructor(
    private prover: Prover,
    private g2Data: Uint8Array,
    private provingKey: Uint8Array,
    private constraintSystem: Uint8Array,
    private pippenger: SinglePippenger,
  ) {}

  public async createProof(witnessArr: Uint8Array): Promise<Uint8Array> {
    const worker = this.prover.getWorker();

    const g2DataPointer = 0;
    await worker.transferToHeap(this.g2Data, g2DataPointer);

    const provingKeyPtr = await worker.call('bbmalloc', this.provingKey.length);
    await worker.transferToHeap(this.provingKey, provingKeyPtr);

    const constraintSystemPtr = await worker.call('bbmalloc', this.constraintSystem.length);
    await worker.transferToHeap(this.constraintSystem, constraintSystemPtr);

    const witnessPtr = await worker.call('bbmalloc', witnessArr.length);
    await worker.transferToHeap(witnessArr, witnessPtr);

    const proverPtr = await worker.call(
      'acir_proofs_new_prover',
      this.pippenger.getPointer(),
      g2DataPointer,
      provingKeyPtr,
      constraintSystemPtr,
      witnessPtr,
    );

    const proof = await this.prover.createProof(proverPtr);

    await worker.call('acir_proofs_delete_prover', proverPtr);
    return proof;
  }

  public getProver(): Prover {
    return this.prover;
  }
}

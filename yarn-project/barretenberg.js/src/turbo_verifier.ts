import { BarretenbergWorker } from './wasm/index.js';

export class TurboVerifier {

  constructor(private worker: BarretenbergWorker, private g2Data: Uint8Array, private verificationKey: Uint8Array, private constraintSystem: Uint8Array){}

  public async verifyProof(proof: Uint8Array): Promise<boolean> {
    const g2DataPointer = 0;
    await this.worker.transferToHeap(this.g2Data, g2DataPointer);

    const verificationKeyPtr = await this.worker.call('bbmalloc', this.verificationKey.length);
    await this.worker.transferToHeap(this.verificationKey, verificationKeyPtr);

    const constraintSystemPtr = await this.worker.call('bbmalloc', this.constraintSystem.length);
    await this.worker.transferToHeap(this.constraintSystem, constraintSystemPtr);

    const proofPtr = await this.worker.call('bbmalloc', proof.length);
    await this.worker.transferToHeap(proof, proofPtr);

    const verified = (await this.worker.call('turbo_verify_proof', g2DataPointer, verificationKeyPtr, constraintSystemPtr, proofPtr, proof.length)) ? true : false;
    await this.worker.call('bbfree', proofPtr);
    return verified;
  }
}

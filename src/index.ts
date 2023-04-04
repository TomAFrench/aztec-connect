import './buffer.js';
import { NetCrs as Crs } from './crs/index.js';
import { PooledFft } from './fft/index.js';
import { PooledPippenger } from './pippenger/index.js';
import { BarretenbergWasm, WorkerPool } from './wasm/index.js';
import { Prover } from './client_proofs/index.js';
import { UltraProver } from './ultra_prover.js';
import { UltraVerifier } from './ultra_verifier.js';

export * from './ultra_prover.js';
export * from './ultra_verifier.js';

/**
 * Takes in a serialized `standard_format` Barretenberg circuit and returns a prover/verifier for this circuit.
 * This format can be generated from ACIR generated by the Noir compiler.
 *
 * `standard_format` is capable of representing any statement.
 *
 * @param serializedCircuit - The serialized Barretenberg circuit for which we want to prove against
 * @returns A tuple of a prover and verifier for the `serializedCircuit`.
 */
export async function setupUltraProverAndVerifier(
  serializedCircuit: Uint8Array,
  provingKey: Uint8Array,
  verificationKey: Uint8Array,
): Promise<[UltraProver, UltraVerifier]> {
  const barretenberg = await BarretenbergWasm.new();

  const circSize = await getCircuitSize(barretenberg, serializedCircuit);

  const crs = await loadCrs(circSize);
  const g2Data = crs.getG2Data();

  const numWorkers = getNumCores();

  const wasm = await BarretenbergWasm.new();
  const workerPool = await WorkerPool.new(wasm, numWorkers);
  const pippenger = new PooledPippenger(workerPool);

  const fft = new PooledFft(workerPool);
  await fft.init(circSize);

  await pippenger.init(crs.getData());

  const prover = new Prover(workerPool.workers[0], pippenger, fft);

  const ultraProver = new UltraProver(prover, g2Data, provingKey, serializedCircuit, pippenger.pool[0]);
  const ultraVerifier = new UltraVerifier(workerPool.workers[0], g2Data, verificationKey, serializedCircuit);

  return Promise.all([ultraProver, ultraVerifier]);
}

async function loadCrs(circSize: number): Promise<Crs> {
  // We may need more elements in the SRS than the circuit size. In particular, we may need circSize +1
  // We add an offset here to account for that
  const offset = 1;

  const crs = new Crs(circSize + offset);
  await crs.init();

  return crs;
}

async function getCircuitSize(wasm: BarretenbergWasm, constraintSystem: Uint8Array): Promise<number> {
  const pool = new WorkerPool();
  await pool.init(wasm.module, 8);
  const worker = pool.workers[0];

  const buf = Buffer.from(constraintSystem);
  const mem = await worker.call('bbmalloc', buf.length);
  await worker.transferToHeap(buf, mem);

  const circSize = await worker.call('acir_proofs_get_exact_circuit_size', mem);
  // FFT requires the circuit size to be a power of two.
  // If it is not, then we round it up to the nearest power of two
  return pow2ceil(circSize);
}

export async function createProof(prover: UltraProver, witnessArr: Uint8Array): Promise<Uint8Array> {
  // computes the proof
  const proof = await prover.createProof(witnessArr);

  return proof;
}

export async function verifyProof(verifier: UltraVerifier, proof: Buffer): Promise<boolean> {
  const verified = await verifier.verifyProof(proof);
  return verified;
}

function getNumCores(): number {
  // TODO: The below comment was when we had this in a separate package
  //
  // Barretenberg.js uses navigator.hardwareConcurrency which is
  // only available in the desktop environment, not in js
  //
  // No need to find a polyfill for it, as our circuit is so small
  return 4;
}

// Rounds `v` up to the next power of two.
function pow2ceil(v: number): number {
  if (v > 0 && !(v & (v - 1))) return v;

  let p = 2;
  while ((v >>= 1)) {
    p <<= 1;
  }
  return p;
}

import {allForks, phase0, Slot, RootHex} from "@chainsafe/lodestar-types";
import {CachedBeaconState} from "@chainsafe/lodestar-beacon-state-transition";
import {CheckpointHex} from "../stateCache";

export enum RegenCaller {
  getDuties = "getDuties",
  produceBlock = "produceBlock",
  validateGossipBlock = "validateGossipBlock",
  produceAttestationData = "produceAttestationData",
  processBlocksInEpoch = "processBlocksInEpoch",
  validateGossipAggregateAndProof = "validateGossipAggregateAndProof",
  validateGossipAttestation = "validateGossipAttestation",
  onForkChoiceFinalized = "onForkChoiceFinalized",
}

export enum RegenFnName {
  getBlockSlotState = "getBlockSlotState",
  getState = "getState",
  getPreState = "getPreState",
  getCheckpointState = "getCheckpointState",
}
/**
 * Regenerates states that have already been processed by the fork choice
 */
export interface IStateRegeneratorInternal {
  /**
   * Return a valid pre-state for a beacon block
   * This will always return a state in the latest viable epoch
   */
  getPreState(block: allForks.BeaconBlock, rCaller: RegenCaller): Promise<CachedBeaconState<allForks.BeaconState>>;

  /**
   * Return a valid checkpoint state
   * This will always return a state with `state.slot % SLOTS_PER_EPOCH === 0`
   */
  getCheckpointState(cp: phase0.Checkpoint, rCaller: RegenCaller): Promise<CachedBeaconState<allForks.BeaconState>>;

  /**
   * Return the state of `blockRoot` processed to slot `slot`
   */
  getBlockSlotState(
    blockRoot: RootHex,
    slot: Slot,
    rCaller: RegenCaller
  ): Promise<CachedBeaconState<allForks.BeaconState>>;

  /**
   * Return the exact state with `stateRoot`
   */
  getState(stateRoot: RootHex, rCaller: RegenCaller): Promise<CachedBeaconState<allForks.BeaconState>>;
}

/**
 * Regenerates states that have already been processed by the fork choice
 */
export interface IStateRegenerator extends IStateRegeneratorInternal {
  /**
   * TEMP - To get justifiedBalances for the fork-choice.
   * Get checkpoint state from memory cache doing no regen
   */
  getCheckpointStateSync(cp: CheckpointHex): CachedBeaconState<allForks.BeaconState> | null;

  /**
   * Add post to cache after verifying and importing block
   */
  addPostState(postState: CachedBeaconState<allForks.BeaconState>): void;
}

import {allForks, Epoch, Root, Slot} from "@chainsafe/lodestar-types";
import {CachedBeaconState} from "../allForks/util/cachedBeaconState";
import {getBlockRootAtSlot} from "./blockRoot";
import {computeEpochAtSlot, computeStartSlotAtEpoch} from "./epoch";

/**
 * Returns the block root which decided the proposer shuffling for the current epoch. This root
 * can be used to key this proposer shuffling.
 *
 * Returns `null` on the one-off scenario where the genesis block decides its own shuffling.
 * It should be set to the latest block applied to this `state` or the genesis block root.
 */
export function proposerShufflingDecisionRoot(state: allForks.BeaconState): Root | null {
  const decisionSlot = proposerShufflingDecisionSlot(state);
  if (state.slot == decisionSlot) {
    return null;
  } else {
    return getBlockRootAtSlot(state, decisionSlot);
  }
}

/**
 * Returns the slot at which the proposer shuffling was decided. The block root at this slot
 * can be used to key the proposer shuffling for the current epoch.
 */
function proposerShufflingDecisionSlot(state: allForks.BeaconState): Slot {
  const epoch = computeEpochAtSlot(state.slot);
  const startSlot = computeStartSlotAtEpoch(epoch);
  return Math.max(startSlot - 1, 0);
}

/**
 * Returns the block root which decided the attester shuffling for the given `requestedEpoch`.
 * This root can be used to key that attester shuffling.
 *
 * Returns `null` on the one-off scenario where the genesis block decides its own shuffling.
 * It should be set to the latest block applied to this `state` or the genesis block root.
 */
export function attesterShufflingDecisionRoot(
  state: CachedBeaconState<allForks.BeaconState>,
  requestedEpoch: Epoch
): Root | null {
  const decisionSlot = attesterShufflingDecisionSlot(state, requestedEpoch);
  if (state.slot == decisionSlot) {
    return null;
  } else {
    return getBlockRootAtSlot(state, decisionSlot);
  }
}

/**
 * Returns the slot at which the proposer shuffling was decided. The block root at this slot
 * can be used to key the proposer shuffling for the current epoch.
 */
function attesterShufflingDecisionSlot(state: CachedBeaconState<allForks.BeaconState>, requestedEpoch: Epoch): Slot {
  const epoch = attesterShufflingDecisionEpoch(state, requestedEpoch);
  const slot = computeStartSlotAtEpoch(epoch);
  return Math.max(slot - 1, 0);
}

/**
 * Returns the epoch at which the attester shuffling was decided.
 *
 * Spec ref: https://github.com/ethereum/eth2.0-APIs/blob/46d2b82127cb1ffce51bbc748a7df2677fc0215a/apis/validator/duties/attester.yaml#L15
 *
 * Throws an error when:
 * - `EpochTooLow` when `requestedEpoch` is more than 1 prior to `currentEpoch`.
 * - `EpochTooHigh` when `requestedEpoch` is more than 1 after `currentEpoch`.
 */
function attesterShufflingDecisionEpoch(state: CachedBeaconState<allForks.BeaconState>, requestedEpoch: Epoch): Epoch {
  const currentEpoch = state.currentShuffling.epoch;
  const previouEpoch = state.previousShuffling.epoch;

  // Next
  if (requestedEpoch === currentEpoch + 1) return currentEpoch;
  // Current
  if (requestedEpoch === currentEpoch) return previouEpoch;
  // Previous
  if (requestedEpoch === currentEpoch - 1) return Math.max(previouEpoch - 1, 0);

  if (requestedEpoch < currentEpoch) {
    throw Error(`EpochTooLow: current ${currentEpoch} requested ${requestedEpoch}`);
  } else {
    throw Error(`EpochTooHigh: current ${currentEpoch} requested ${requestedEpoch}`);
  }
}

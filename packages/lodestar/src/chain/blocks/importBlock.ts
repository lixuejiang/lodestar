import {SLOTS_PER_EPOCH} from "@chainsafe/lodestar-params";
import {readonlyValues, toHexString} from "@chainsafe/ssz";
import {allForks} from "@chainsafe/lodestar-types";
import {
  CachedBeaconState,
  computeStartSlotAtEpoch,
  getEffectiveBalances,
} from "@chainsafe/lodestar-beacon-state-transition";
import {IForkChoice, OnBlockPrecachedData} from "@chainsafe/lodestar-fork-choice";
import {ILogger} from "@chainsafe/lodestar-utils";
import {IChainForkConfig} from "@chainsafe/lodestar-config";
import {IMetrics} from "../../metrics";
import {IBeaconDb} from "../../db";
import {toCheckpointHex} from "../stateCache";
import {ChainEvent} from "../emitter";
import {ChainEventEmitter} from "../emitter";
import {getCheckpointFromState} from "./utils/checkpoint";
import {PendingEvents} from "./utils/pendingEvents";
import {FullyVerifiedBlock} from "./types";
import {IStateRegenerator} from "../regen";

export type ImportBlockModules = {
  db: IBeaconDb;
  forkChoice: IForkChoice;
  regen: IStateRegenerator;
  emitter: ChainEventEmitter;
  config: IChainForkConfig;
  logger: ILogger;
  metrics: IMetrics | null;
};

/**
 * Imports a fully verified block into the chain state. Produces multiple permanent side-effects.
 *
 * Import block:
 * - Observe attestations
 * - Add validators to the pubkey cache
 * - Load shuffling caches
 * - Do weak subjectivy check
 * - Register block with fork-hoice
 * - Register state and block to the validator monitor
 * - For each attestation
 *   - Get indexed attestation
 *   - Register attestation with fork-choice
 *   - Register attestation with validator monitor (only after sync)
 * - Write block and state to hot db
 * - Write block and state to snapshot_cache
 * - head_tracker.register_block(block_root, parent_root, slot)
 * - Send events after everything is done
 */
export async function importBlock(chain: ImportBlockModules, fullyVerifiedBlock: FullyVerifiedBlock): Promise<void> {
  const {block, postState, skipImportingAttestations} = fullyVerifiedBlock;

  const pendingEvents = new PendingEvents(chain.emitter);

  // - Observe attestations
  // TODO
  // - Add validators to the pubkey cache
  // TODO
  // - Load shuffling caches
  // TODO
  // - Do weak subjectivy check
  // TODO

  // - Register block with fork-hoice

  // TODO IDEA: Lighthouse keeps a cache of checkpoint balances internally in the forkchoice store to be used latter
  // Ref: https://github.com/sigp/lighthouse/blob/f9bba92db3468321b28ddd9010e26b359f88bafe/beacon_node/beacon_chain/src/beacon_fork_choice_store.rs#L79
  //
  // current justified checkpoint should be prev epoch or current epoch if it's just updated
  // it should always have epochBalances there bc it's a checkpoint state, ie got through processEpoch
  const justifiedCheckpoint = postState.currentJustifiedCheckpoint;
  const onBlockPrecachedData: OnBlockPrecachedData = {};
  if (justifiedCheckpoint.epoch > chain.forkChoice.getJustifiedCheckpoint().epoch) {
    const state = getStateForJustifiedBalances(chain, postState, block);
    onBlockPrecachedData.justifiedBalances = getEffectiveBalances(state);
  }

  // TODO: Figure out how to fetch for merge
  //  powBlock: undefined,
  //  powBlockParent: undefined,

  chain.forkChoice.onBlock(block.message, postState, onBlockPrecachedData);

  // - For each attestation
  //   - Get indexed attestation
  //   - Register attestation with fork-choice
  //   - Register attestation with validator monitor (only after sync)
  // Only process attestations in response to an non-prefinalized block
  if (!skipImportingAttestations) {
    const attestations = Array.from(readonlyValues(block.message.body.attestations));

    for (const attestation of attestations) {
      try {
        const indexedAttestation = postState.epochCtx.getIndexedAttestation(attestation);
        chain.forkChoice.onAttestation(indexedAttestation);
        chain.metrics?.registerAttestationInBlock(indexedAttestation, block.message);
        pendingEvents.push(ChainEvent.attestation, attestation);
      } catch (e) {
        chain.logger.error("Error processing attestation from block", {slot: block.message.slot}, e as Error);
      }
    }
  }

  // Emit ChainEvent.forkChoiceHead event
  const oldHead = chain.forkChoice.getHead();
  chain.forkChoice.updateHead();
  const newHead = chain.forkChoice.getHead();
  if (newHead.blockRoot !== oldHead.blockRoot) {
    // new head
    pendingEvents.push(ChainEvent.forkChoiceHead, newHead);
    chain.metrics?.forkChoiceChangedHead.inc();

    const distance = chain.forkChoice.getCommonAncestorDistance(oldHead, newHead);
    if (distance !== null) {
      // chain reorg
      pendingEvents.push(ChainEvent.forkChoiceReorg, newHead, oldHead, distance);
      chain.metrics?.forkChoiceReorg.inc();
    }

    // MUST BE CALLED IF HEAD CHANGES !!! Otherwise the node will use the wrong state as head.
    // Currently the cannonical head information is split between `forkChoice.getHead()` to get just a summary, and
    // regen.getHeadState() to get the state of that head.
    //
    // Set head state in regen. May trigger async regen if the state is not in a memory cache
    chain.regen.setHead(newHead, postState).catch((e) => {
      chain.logger.error("Error setting head state", {slot: newHead.slot, stateRoot: newHead.stateRoot}, e);
    });
  }

  // - Register state and block to the validator monitor
  // TODO

  // MUST happen before any other block is processed
  // This adds the state necessary to process the next block
  // - Write block and state to hot db
  // - Write block and state to snapshot_cache
  chain.regen.addPostState(postState);
  await chain.db.block.add(block);

  // - head_tracker.register_block(block_root, parent_root, slot)
  // - Send event after everything is done

  // Emit all events at once after fully completing importBlock()
  // Emit ChainEvent.block event
  chain.emitter.emit(ChainEvent.block, block, postState);

  if (block.message.slot % SLOTS_PER_EPOCH === 0) {
    const checkpointState = postState.clone();
    const cp = getCheckpointFromState(checkpointState);
    chain.emitter.emit(ChainEvent.checkpoint, cp, checkpointState);
  }
  pendingEvents.emit();
}

/**
 * Returns the closest state to postState.currentJustifiedCheckpoint in the same fork as postState
 *
 * From the spec https://github.com/ethereum/consensus-specs/blob/dev/specs/phase0/fork-choice.md#get_latest_attesting_balance
 * The state from which to read balances is:
 *
 * ```python
 * state = store.checkpoint_states[store.justified_checkpoint]
 * ```
 *
 * ```python
 * def store_target_checkpoint_state(store: Store, target: Checkpoint) -> None:
 *    # Store target checkpoint state if not yet seen
 *    if target not in store.checkpoint_states:
 *        base_state = copy(store.block_states[target.root])
 *        if base_state.slot < compute_start_slot_at_epoch(target.epoch):
 *            process_slots(base_state, compute_start_slot_at_epoch(target.epoch))
 *        store.checkpoint_states[target] = base_state
 * ```
 *
 * So the state to get justified balances is the post state of `checkpoint.root` dialed forward to the first slot in
 * `checkpoint.epoch` if that block is not in `checkpoint.epoch`.
 */
function getStateForJustifiedBalances(
  chain: ImportBlockModules,
  postState: CachedBeaconState<allForks.BeaconState>,
  block: allForks.SignedBeaconBlock
): CachedBeaconState<allForks.BeaconState> {
  const justifiedCheckpoint = postState.currentJustifiedCheckpoint;
  const checkpointHex = toCheckpointHex(justifiedCheckpoint);
  const checkpointSlot = computeStartSlotAtEpoch(checkpointHex.epoch);

  // First, check if the checkpoint block in the checkpoint epoch, by getting the block summary from the fork-choice
  const checkpointBlock = chain.forkChoice.getBlockHex(checkpointHex.rootHex);
  if (!checkpointBlock) {
    // Should never happen
    return postState;
  }

  // NOTE: The state of block checkpointHex.rootHex may be prior to the justified checkpoint if it was a skipped slot.
  if (checkpointBlock.slot >= checkpointSlot) {
    const checkpointBlockState = chain.stateCache.get(checkpointBlock.stateRoot);
    if (checkpointBlockState) {
      return checkpointBlockState;
    }
  }

  // If here, the first slot of `checkpoint.epoch` is a skipped slot. Check if the state is in the checkpoint cache.
  // NOTE: This state and above are correct with the spec.
  // NOTE: If the first slot of the epoch was skipped and the node is syncing, this state won't be in the cache.
  const state = chain.checkpointStateCache.get(checkpointHex);
  if (state) {
    return state;
  }

  // If it's not found, then find the oldest state in the same chain as this one
  // NOTE: If `block.message.parentRoot` is not in the fork-choice, `iterateAncestorBlocks()` returns `[]`
  // NOTE: This state is not be correct with the spec, it may have extra modifications from multiple blocks.
  //       However, it's a best effort before triggering an async regen process. In the future this should be fixed
  //       to use regen and get the correct state.
  let oldestState = postState;
  for (const parentBlock of chain.forkChoice.iterateAncestorBlocks(toHexString(block.message.parentRoot))) {
    // We want at least a state at the slot 0 of checkpoint.epoch
    if (parentBlock.slot < checkpointSlot) {
      break;
    }

    const parentBlockState = chain.stateCache.get(parentBlock.stateRoot);
    if (parentBlockState) {
      oldestState = parentBlockState;
    }
  }

  // TODO: Use regen to get correct state. Note that making this function async can break the import flow.
  //       Also note that it can dead lock regen and block processing since both have a concurrency of 1.

  chain.logger.error("State for currentJustifiedCheckpoint not available, using closest state", {
    checkpointEpoch: checkpointHex.epoch,
    checkpointRoot: checkpointHex.rootHex,
    stateSlot: oldestState.slot,
    stateRoot: toHexString(oldestState.hashTreeRoot()),
  });

  return oldestState;
}

import {ForkName} from "@chainsafe/lodestar-params";
import {DomainType, ForkDigest, Slot} from "@chainsafe/lodestar-types";

export type ForkDigestHex = string;

export interface IForkDigestContext {
  forkDigest2ForkName(forkDigest: ForkDigest | ForkDigestHex): ForkName;
  forkName2ForkDigest(forkName: ForkName): ForkDigest;
  forkName2ForkDigestHex(forkName: ForkName): ForkDigestHex;
}

export interface ICachedGenesis extends IForkDigestContext {
  getDomain(domainType: DomainType, slot: Slot): Buffer;
}

import {ForkName} from "@chainsafe/lodestar-params";
import {DomainType, ForkDigest, phase0, Root, Slot, ssz, Version} from "@chainsafe/lodestar-types";
import {ByteVector, toHexString} from "@chainsafe/ssz";
import {IChainForkConfig} from "../beaconConfig";
import {ForkDigestHex, ICachedGenesis} from "./types";
export {IForkDigestContext} from "./types";

export function createICachedGenesis(chainForkConfig: IChainForkConfig, genesisValidatorsRoot: Root): ICachedGenesis {
  const domainCache = new Map<ForkName, Map<DomainType, Buffer>>();

  const forkDigestByForkName = new Map<ForkName, ForkDigest>();
  const forkDigestHexByForkName = new Map<ForkName, ForkDigestHex>();
  /** Map of ForkDigest in hex format without prefix: `0011aabb` */
  const forkNameByForkDigest = new Map<ForkDigestHex, ForkName>();

  for (const fork of Object.values(chainForkConfig.forks)) {
    const forkDigest = computeForkDigest(fork.version, genesisValidatorsRoot);
    const forkDigestHex = toHexStringNoPrefix(forkDigest);
    forkNameByForkDigest.set(forkDigestHex, fork.name);
    forkDigestByForkName.set(fork.name, forkDigest);
    forkDigestHexByForkName.set(fork.name, forkDigestHex);
  }

  return {
    getDomain(domainType: DomainType, slot: Slot): Buffer {
      const forkInfo = chainForkConfig.getForkInfo(slot);
      let domainByType = domainCache.get(forkInfo.name);
      if (!domainByType) {
        domainByType = new Map<DomainType, Buffer>();
        domainCache.set(forkInfo.name, domainByType);
      }
      let domain = domainByType.get(domainType);
      if (!domain) {
        domain = computeDomain(domainType, forkInfo.version, genesisValidatorsRoot);
        domainByType.set(domainType, domain);
      }
      return domain;
    },

    forkDigest2ForkName(forkDigest: ForkDigest | ForkDigestHex): ForkName {
      const forkDigestHex = toHexStringNoPrefix(forkDigest);
      const forkName = forkNameByForkDigest.get(forkDigestHex);
      if (!forkName) {
        throw Error(`Unknwon forkDigest ${forkDigestHex}`);
      }
      return forkName;
    },

    forkName2ForkDigest(forkName: ForkName): ForkDigest {
      const forkDigest = forkDigestByForkName.get(forkName);
      if (!forkDigest) {
        throw Error(`No precomputed forkDigest for ${forkName}`);
      }
      return forkDigest;
    },

    forkName2ForkDigestHex(forkName: ForkName): ForkDigestHex {
      const forkDigestHex = forkDigestHexByForkName.get(forkName);
      if (!forkDigestHex) {
        throw Error(`No precomputed forkDigest for ${forkName}`);
      }
      return toHexStringNoPrefix(forkDigestHex);
    },
  };
}

function computeDomain(domainType: DomainType, forkVersion: Version, genesisValidatorRoot: Root): Buffer {
  const forkDataRoot = computeForkDataRoot(forkVersion, genesisValidatorRoot);
  return Buffer.concat([domainType as Buffer, forkDataRoot.slice(0, 28)]);
}

function computeForkDataRoot(currentVersion: Version, genesisValidatorsRoot: Root): Uint8Array {
  const forkData: phase0.ForkData = {
    currentVersion,
    genesisValidatorsRoot,
  };
  return ssz.phase0.ForkData.hashTreeRoot(forkData);
}

function toHexStringNoPrefix(hex: string | ByteVector): string {
  return strip0xPrefix(typeof hex === "string" ? hex : toHexString(hex));
}

function strip0xPrefix(hex: string): string {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

function computeForkDigest(currentVersion: Version, genesisValidatorsRoot: Root): ForkDigest {
  return computeForkDataRoot(currentVersion, genesisValidatorsRoot).slice(0, 4);
}

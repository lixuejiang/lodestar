import {BeaconNode} from "../../../src/node";
import {ValidatorDB} from "../../../src/db/api";
import {LevelDbController} from "../../../src/db/controller";
import {Keypair, PrivateKey} from "@chainsafe/bls";
import {ApiClientOverInstance, interopKeypair, Validator} from "@chainsafe/lodestar-validator/lib";
import {LogLevel, WinstonLogger, ILogger} from "@chainsafe/lodestar-utils";
import tmp from "tmp";
import {ValidatorApi} from "../../../src/api/impl/validator";
import {BeaconApi} from "../../../src/api/impl/beacon";
import {NodeApi} from "../../../src/api/impl/node/node";

export function getDevValidators(node: BeaconNode, count = 8): Validator[] {
  return Array.from({length: count}, (v, index) => {
    return getDevValidator({node, index});
  });
}

export function getDevValidator({
  node,
  index,
  logger
}: {
  node: BeaconNode;
  index: number;
  logger?: ILogger;
}): Validator {
  if (!logger) logger = new WinstonLogger({level: LogLevel.warn});
  const tmpDir = tmp.dirSync({unsafeCleanup: true});
  return new Validator({
    config: node.config,
    db: new ValidatorDB({
      config: node.config,
      controller: new LevelDbController({
        name: tmpDir.name
      }, {logger})
    }),
    api: new ApiClientOverInstance({
      config: node.config,
      validator: new ValidatorApi({}, {...node, logger}),
      node: new NodeApi({}, {...node}),
      beacon: new BeaconApi({}, {...node}),
    }),
    logger: logger,
    keypair: new Keypair(PrivateKey.fromBytes(interopKeypair(index).privkey))
  });
}

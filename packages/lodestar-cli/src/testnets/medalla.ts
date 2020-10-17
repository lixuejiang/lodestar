import {IBeaconParams} from "@chainsafe/lodestar-params";
import {fromHexString} from "@chainsafe/ssz";

/* eslint-disable max-len */

export const beaconParams: Partial<IBeaconParams> = {
  DEPOSIT_CHAIN_ID: 5,
  DEPOSIT_NETWORK_ID: 5,
  MIN_GENESIS_TIME: 1596546000,
  DEPOSIT_CONTRACT_ADDRESS: Buffer.from(fromHexString("0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC")),
  GENESIS_FORK_VERSION: Buffer.from(fromHexString("0x00000001")),
  MAX_EPOCHS_PER_CROSSLINK: 64,
};

export const depositContractDeployBlock = 3085928;
export const genesisFileUrl =
  "https://github.com/eth2-clients/eth2-testnets/blob/master/shared/medalla/genesis.ssz?raw=true";
export const bootnodesFileUrl = "https://github.com/goerli/medalla/raw/master/medalla/bootnodes.txt";

export const bootEnrs = [
  "enr:-KG4QIOJRu0BBlcXJcn3lI34Ub1aBLYipbnDaxBnr2uf2q6nE1TWnKY5OAajg3eG6mHheQSfRhXLuy-a8V5rqXKSoUEChGV0aDKQGK5MywAAAAH__________4JpZIJ2NIJpcIQKAAFhiXNlY3AyNTZrMaEDESplmV9c2k73v0DjxVXJ6__2bWyP-tK28_80lf7dUhqDdGNwgiMog3VkcIIjKA",
  "enr:-Ku4QLglCMIYAgHd51uFUqejD9DWGovHOseHQy7Od1SeZnHnQ3fSpE4_nbfVs8lsy8uF07ae7IgrOOUFU0NFvZp5D4wBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpAYrkzLAAAAAf__________gmlkgnY0gmlwhBLf22SJc2VjcDI1NmsxoQJxCnE6v_x2ekgY_uoE1rtwzvGy40mq9eD66XfHPBWgIIN1ZHCCD6A",
  "enr:-Ku4QOdk3u7rXI5YvqwmEbApW_OLlRkq_yzmmhdlrJMcfviacLWwSm-tr1BOvamuRQqfc6lnMeec4E4ddOhd3KqCB98Bh2F0dG5ldHOIAAAAAAAAAACEZXRoMpAYrkzLAAAAAf__________gmlkgnY0gmlwhBLf22SJc2VjcDI1NmsxoQKH3lxnglLqrA7L6sl5r7XFnckr3XCnlZMaBTYSdE8SHIN1ZHCCG1g",
  "enr:-Ku4QOVrqhlmsh9m2MGSnvVz8XPfjwHWBuOcgVQvWwBhN0-NI0XVhSerujBBwIeLpc-OES0C9iAzJhiCgRZ0xH13DgEBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpAYrkzLAAAAAf__________gmlkgnY0gmlwhBLf22SJc2VjcDI1NmsxoQLEq16KLm1vPjUKYGkHq296D60i7y209NYPUpwZPXDVgYN1ZHCCF3A",
  "enr:-LK4QC3FCb7-JTNRiWAezECk_QUJc9c2IkJA1-EAmqAA5wmdbPWsAeRpnMXKRJqOYG0TE99ycB1nOb9y26mjb_UoHS4Bh2F0dG5ldHOIAAAAAAAAAACEZXRoMpDnp11aAAAAAf__________gmlkgnY0gmlwhDMPYfCJc2VjcDI1NmsxoQOmDQryZJApMwIT-dQAbxjvxLbPzyKn9GFk5dqam4MDTYN0Y3CCIyiDdWRwgiMo",
  "enr:-LK4QLvxLzt346gAPkTxohygiJvjd97lGcFeE5yXgZKtsMfEOveLE_FO2slJoHNzNF7vhwfwjt4X2vqzwGiR9gcrmDMBh2F0dG5ldHOIAAAAAAAAAACEZXRoMpDnp11aAAAAAf__________gmlkgnY0gmlwhDMPRgeJc2VjcDI1NmsxoQPjXTGx3HkaCG2neFxJmaTn5eCgbra3LY1twCeXPHChL4N0Y3CCIyiDdWRwgiMo",
  "enr:-Ku4QFVactU18ogiqPPasKs3jhUm5ISszUrUMK2c6SUPbGtANXVJ2wFapsKwVEVnVKxZ7Gsr9yEc4PYF-a14ahPa1q0Bh2F0dG5ldHOIAAAAAAAAAACEZXRoMpAYrkzLAAAAAf__________gmlkgnY0gmlwhGQbAHyJc2VjcDI1NmsxoQILF-Ya2i5yowVkQtlnZLjG0kqC4qtwmSk8ha7tKLuME4N1ZHCCIyg",
];

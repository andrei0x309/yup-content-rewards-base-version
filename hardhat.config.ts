import { HardhatUserConfig, } from "hardhat/config";
import { vars } from "hardhat/config"
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'

const PK = vars.get("PK") 

const POLYGON_RPC = vars.get("POLYGON_RPC")

 
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.25",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1000,
        details: {
          yul: true,
          constantOptimizer: true,
        }
      }
    }
  },
  networks: {
    polygon: {
      url: POLYGON_RPC,
      accounts: [PK]
    },
    hardhat: {
      accounts: [
        {privateKey: PK, balance: "1000000000000000000000000"}
      ]
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [PK] 
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      accounts: [PK]
    }
 }
};

export default config;


import { HardhatUserConfig, } from "hardhat/config";
import { vars } from "hardhat/config"
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'

const PK = vars.get("PK") 


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
    hardhat: {
      accounts: [
        {privateKey: PK, balance: "1000000000000000000000000"}
      ]
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [PK] 
    },
    base: {
      url: "https://base-rpc.publicnode.com",
      accounts: [PK]
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      accounts: [PK]
    }
 }
};

export default config;


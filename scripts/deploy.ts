import { ethers, upgrades } from "hardhat";
import { getAddresses } from "./utils/addresses";

const isTesting = process.env.IS_TESTING === "true" || false

let { YUP_BASE_CONTENT_REWARDS, YUPTOKEN_SAMPLE_PROXY, owner } = getAddresses(!isTesting)

// YUP BACKEND ADDRESS
const CERTIFY_ADDRESS = "0xB3e40374054bE93e8328f50FFad1464d0E1D990D"

export const deployOrUpdateYUPCtBaseRewards = async () => {

  const yupToken = YUPTOKEN_SAMPLE_PROXY

  const maxValidity = 60 * 60 * 3 // 3 hours

  const args = [owner, yupToken, CERTIFY_ADDRESS, maxValidity]

  const Contract = await ethers.getContractFactory("YupBaseContentRewards");

  let status = "deployed"

  let existing = YUP_BASE_CONTENT_REWARDS && await ethers.getContractAt("YupBaseContentRewards", YUP_BASE_CONTENT_REWARDS) || null
  let contractAddress = YUP_BASE_CONTENT_REWARDS

  if (!existing) {
    const contract = await upgrades.deployProxy(Contract, args, {
      initializer: 'initialize',
      kind: 'uups'
    });

    contractAddress = await contract.getAddress()
  } else {
    upgrades.upgradeProxy(existing, Contract)
    status = "upgraded"

  }

  console.log(
    `Contract [ YupBaseContentRewards ] [${status}] to args: ${args} at: ${contractAddress}`
  );

}

export const getCertifySigner = async () => {
  const Contract = await ethers.getContractFactory("YupBaseContentRewards");
  const contract = await Contract.attach(YUP_BASE_CONTENT_REWARDS)
  const signer = await contract.getCertifySigner()
  console.log("Certify signer: ", signer)
}

export const setCertifySigner = async (signer: string) => {
  const Contract = await ethers.getContractFactory("YupBaseContentRewards");
  const contract = await Contract.attach(YUP_BASE_CONTENT_REWARDS)
  const tx = await contract.setCertifySigner(signer)
  console.log("Certify signer set to: ", signer)
}

export const deployOrUpdateYupTokenSample = async () => {

  const args = [owner]

  const Contract = await ethers.getContractFactory("YupTokenSample");

  let status = "deployed"

  let existing = YUPTOKEN_SAMPLE_PROXY && await ethers.getContractAt("YupTokenSample", YUPTOKEN_SAMPLE_PROXY) || null
  let contractAddress = YUPTOKEN_SAMPLE_PROXY

  if (!existing) {
    const contract = await upgrades.deployProxy(Contract, args, {
      initializer: 'initialize',
      kind: 'uups'
    });

    contractAddress = await contract.getAddress()

    YUPTOKEN_SAMPLE_PROXY = contractAddress

  } else {
    upgrades.upgradeProxy(existing, Contract)
    status = "upgraded"
  }

  console.log(
    `Contract [ YupTokenSample ] [${status}] to: ${contractAddress}`
  );

}


async function main () {
  // if(isTesting) return;
  // await deployOrUpdateYupTokenSample() 
  // await deployOrUpdateYUPCtBaseRewards()
  await getCertifySigner();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

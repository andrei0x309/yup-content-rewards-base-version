import { ethers } from "hardhat";
import { vars } from "hardhat/config"
import { getAddresses } from "./utils/addresses";

const PK = vars.get("PK")

const isTesting = process.env.IS_TESTING === "true" || false

let { YUP_BASE_CONTENT_REWARDS, YUPTOKEN_SAMPLE_PROXY, owner } = getAddresses(!isTesting)

const MINT_AMOUNT = 50000;

export const mintSample = async () => {

  const Contract = await ethers.getContractFactory("YupTokenSample");

  let existing = YUPTOKEN_SAMPLE_PROXY && await ethers.getContractAt("YupTokenSample", YUPTOKEN_SAMPLE_PROXY) || null
  let contractAddress = YUPTOKEN_SAMPLE_PROXY

  if (!existing) {
    console.log("Contract yupTokenSample not deployed")
    return
  }

  const contract = await Contract.attach(contractAddress)

  const mintArgs = [YUP_BASE_CONTENT_REWARDS, ethers.parseEther(MINT_AMOUNT.toString())]
  console.log("Minting...")

  const tx = await contract.mint(...mintArgs)

  console.log("Minted!, tx: ", tx.hash)

}

const constructValidClaimString = async (amount: number, address: string, ts: number) => {
  const stringToSign = `${amount}|${address}|${ts}`
  const signer = new ethers.Wallet(PK)
  const signature = await signer.signMessage(stringToSign)
  return `${stringToSign}|${signature}`
}

const executeClaim = async () => {

  const amount = 100
  const address = owner
  const ts = Math.trunc(Date.now() / 1000)
  const claimString = await constructValidClaimString(amount, address, ts)

  const Contract = await ethers.getContractFactory("YupBaseContentRewards");
  let existing = YUP_BASE_CONTENT_REWARDS && await ethers.getContractAt("YupBaseContentRewards", YUP_BASE_CONTENT_REWARDS) || null
  let contractAddress = YUP_BASE_CONTENT_REWARDS

  if (!existing) {
    console.log("Contract yupBaseContentRewards not deployed")
    return
  }

  const contract = await Contract.attach(contractAddress)

  const claimArgs = [claimString]
  console.log("Claiming...", claimArgs)
  try {
    const tx = await contract.claimTokens(...claimArgs)

    console.log("Claimed!, tx: ", tx.hash)

  } catch (e) {
    console.log(e)
  }

}

async function main () {
  if (isTesting) return;
  await mintSample();
  // await executeClaim();
  // await getLastLogsAddAccess();
  // await witdrawTokens();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

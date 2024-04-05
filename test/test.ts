import { expect } from 'chai';
import { ethers, upgrades } from "hardhat";
import { vars } from "hardhat/config"


const owner =  '0x01Ca6f13E48fC5E231351bA38e7E51A1a7835d8D'
let deployTokenAddress = ''
let deployRewardsAddress = ''

const PK = vars.get("PK")


describe('Tests', () => {
  it('deploy token', async () => {
    const args = [owner]
    
    const Contract = await ethers.getContractFactory("YupTokenSample");
  
    let status = "deployed"
    
      const contract = await upgrades.deployProxy(Contract, args, {
        initializer: 'initialize',
        kind: 'uups'
      });
    
      const contractAddress = await contract.getAddress()

    console.log(
      `Contract [ YupTokenSample ] [${status}] to: ${contractAddress}`
    );
     
    deployTokenAddress = contractAddress

    expect(deployTokenAddress).to.not.equal('')
  });
  it('deploy rewards contract', async () => {
    
    const maxClaimTs = 60 * 60 * 3
    const args = [owner, deployTokenAddress, maxClaimTs]
    
    const Contract = await ethers.getContractFactory("YupBaseContentRewards");
   
    let status = "deployed"
    
       const contract = await upgrades.deployProxy(Contract, args, {
         initializer: 'initialize',
         kind: 'uups'
       });
     
     const contractAddress = await contract.getAddress()

     console.log(
       `Contract [ YupBaseContentRewards ] [${status}] to args: ${args} at: ${contractAddress}`
     );

    deployRewardsAddress = contractAddress

    expect(deployRewardsAddress).to.not.equal('')
    });
    it('shoud mint some tokens to rewards contract', async () => {
        console.log("Deployed token address: ", deployTokenAddress)

        const Contract = await ethers.getContractFactory("YupTokenSample");
        const MINT_AMOUNT = 50000
        const contract = await Contract.attach(deployTokenAddress)

        const mintArgs =  [deployRewardsAddress, ethers.parseEther(MINT_AMOUNT.toString())]
        console.log("Minting...")

        const tx = await contract.mint(...mintArgs)

        console.log("Minted!, tx: ", tx.hash)

        expect(tx.hash).to.not.equal('')
    })
    it ('should claim some tokens', async () => {
        const amount = ethers.parseEther('100')
        const address = owner
        const ts = Math.trunc(Date.now() / 1000)
        const claimString = `${amount}|${address}|${ts}`
        const signer = new ethers.Wallet(PK)
        const signature = await signer.signMessage(claimString)
        const claim = `${claimString}|${signature.replace('0x', '')}`

        const Contract = await ethers.getContractFactory("YupBaseContentRewards");
        const contract = await Contract.attach(deployRewardsAddress)

        const claimArgs = [claim]
        console.log("Claiming...", claimArgs)
        try {
            const tx = await contract.claimTokens(...claimArgs)
            console.log("Claimed!, tx: ", tx.hash)
            expect(tx.hash).to.not.equal('')
        } catch (error) {
            console.log('Error claiming:', error)
        }
    }),
    it('should fail to claim tokens due to expired claim', async () => {
        const amount = ethers.parseEther('100')
        const address = owner
        const sevenHoursAgo = Math.trunc(Date.now() / 1000) - 60 * 60 * 7
        const claimString = `${amount}|${address}|${sevenHoursAgo}`
        const signer = new ethers.Wallet(PK)
        const signature = await signer.signMessage(claimString)
        const claim = `${claimString}|${signature.replace('0x', '')}`

        const Contract = await ethers.getContractFactory("YupBaseContentRewards");
        const contract = await Contract.attach(deployRewardsAddress)

        const claimArgs = [claim]
        console.log("Claiming...", claimArgs)
        let failed = false
        try {
            const tx = await contract.claimTokens(...claimArgs)
            expect(tx.hash).to.not.equal('')
        } catch {
            failed = true
        }
        expect(failed).to.be.true
    })
    it('should fail to claim tokens due to invalid signature', async () => {
        const amount = ethers.parseEther('100')
        const address = owner
        const ts = Math.trunc(Date.now() / 1000)
        const claimString = `${amount}|${address}|${ts}|INVALID_DATA`
        const signer = new ethers.Wallet(PK)
        const signature = await signer.signMessage(claimString)
        const claim = `${claimString}|${signature.replace('0x', '')}`

        const Contract = await ethers.getContractFactory("YupBaseContentRewards");
        const contract = await Contract.attach(deployRewardsAddress)

        const claimArgs = [claim]
        console.log("Claiming...", claimArgs)
        let failed = false
        try {
            const tx = await contract.claimTokens(...claimArgs)
            expect(tx.hash).to.not.equal('')
        } catch {
            failed = true
        }
        expect(failed).to.be.true
    }),
    it('should fail to claim tokens due to invalid address', async () => {
        const amount = ethers.parseEther('100')
        const address = '0x002'
        const ts = Math.trunc(Date.now() / 1000)
        const claimString = `${amount}|${address}|${ts}`
        const signer = new ethers.Wallet(PK)
        const signature = await signer.signMessage(claimString)
        const claim = `${claimString}|${signature.replace('0x', '')}`
        const Contract = await ethers.getContractFactory("YupBaseContentRewards");
        const contract = await Contract.attach(deployRewardsAddress)

        const claimArgs = [claim]
        console.log("Claiming...", claimArgs)
        let failed = false
        try {
            const tx = await contract.claimTokens(...claimArgs)
            expect(tx.hash).to.not.equal('')
        } catch {
            failed = true
        }
        expect(failed).to.be.true
    }),
    it('should fail to claim tokens due to invalid amount', async () => {
        const amount = ethers.parseEther('0')
        const address = owner
        const ts = Math.trunc(Date.now() / 1000)
        const claimString = `${amount}|${address}|${ts}`
        const signer = new ethers.Wallet(PK)
        const signature = await signer.signMessage(claimString)
        const claim = `${claimString}|${signature.replace('0x', '')}`
        const Contract = await ethers.getContractFactory("YupBaseContentRewards");
        const contract = await Contract.attach(deployRewardsAddress)

        const claimArgs = [claim]
        console.log("Claiming...", claimArgs)
        let failed = false
        try {
            const tx = await contract.claimTokens(...claimArgs)
            expect(tx.hash).to.not.equal('')
        } catch {
            failed = true
        }
        expect(failed).to.be.true
    }),
    it('should fail to claim again if already claimed once within the same claim period', async () => {
        const amount = ethers.parseEther('100')
        const address = owner
        const ts = Math.trunc(Date.now() / 1000)
        const claimString = `${amount}|${address}|${ts}`
        const signer = new ethers.Wallet(PK)
        const signature = await signer.signMessage(claimString)
        const claim = `${claimString}|${signature.replace('0x', '')}`
        const Contract = await ethers.getContractFactory("YupBaseContentRewards");
        const contract = await Contract.attach(deployRewardsAddress)

        const claimArgs = [claim]
        console.log("Claiming...", claimArgs)
        let failed = false
        try {
            const tx = await contract.claimTokens(...claimArgs)
            expect(tx.hash).to.not.equal('')
        } catch {
        }

        try {
            const tx = await contract.claimTokens(...claimArgs)
            expect(tx.hash).to.not.equal('')
        } catch  {
            failed = true
        }

        expect(failed).to.be.true
    })
});
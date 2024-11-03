const hre = require('hardhat');

async function main() {
  try {
    // Get the contract factory
    const TransparentCrowdfunding = await hre.ethers.getContractFactory(
      'TransparentCrowdfunding'
    );

    // Deploy the contract
    console.log('Deploying TransparentCrowdfunding contract...');
    const transparentCrowdfunding = await TransparentCrowdfunding.deploy();

    // Wait for deployment to finish
    // await transparentCrowdfunding.waitForDeployment();
    const contractAddress = await transparentCrowdfunding.address;

    console.log(
      'TransparentCrowdfunding contract deployed to:',
      contractAddress
    );
    console.log('Save this address for interaction script!');
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

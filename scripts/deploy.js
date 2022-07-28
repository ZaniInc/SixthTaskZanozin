
const hre = require("hardhat");

async function main() {

  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.deployed();
  const Vesting = await hre.ethers.getContractFactory("VestingUpgradeable");
  const vesting = await Vesting.deploy();
  await vesting.deployed();
  const vestingProxy = await upgrades.deployProxy(Vesting,[myToken.address]);
  await vestingProxy.deployed();

  console.log("Vesting deployed to:", vesting.address);
  console.log("MyToken deployed to:", myToken.address);
  console.log("vestingProxy deployed to:", vestingProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
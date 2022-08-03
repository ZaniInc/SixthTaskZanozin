
const hre = require("hardhat");
const owner = "0xC4aA7812309C2e9CF04fb0fC2Ba2492b8DaB1A16";

async function main() {

  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();
  await myToken.deployed();
  const Vesting = await hre.ethers.getContractFactory("VestingUpgradeable");
  const vesting = await Vesting.deploy();
  await vesting.deployed();
  const ProxyContract = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  const proxy = await ProxyContract.deploy(vesting.address, owner, []);
  await proxy.deployed();

  console.log("Vesting deployed to:", vesting.address);
  console.log("MyToken deployed to:", myToken.address);
  console.log("Proxy deployed to:", proxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
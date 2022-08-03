
const hre = require("hardhat");
const owner = "0xC4aA7812309C2e9CF04fb0fC2Ba2492b8DaB1A16";

async function main() {

  const VestingV3 = await hre.ethers.getContractFactory("VestingUpgradeableV3");
  const vestingV3 = await VestingV3.deploy();
  await vestingV3.deployed();

  console.log("VestingV3 deployed to:", vestingV3.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
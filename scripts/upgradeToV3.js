
const hre = require("hardhat");
const owner = "0xC4aA7812309C2e9CF04fb0fC2Ba2492b8DaB1A16";
const vestingV3 = "0xD81F99940b89D505C1E9370d18b6a76ED76e4E92";

async function main() {

  const ProxyContract = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  const proxy = await ProxyContract.attach("0x4871F59ADa92D0c16474c3Adef495c9A49921Ca3");
  await proxy.upgradeTo(vestingV3);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
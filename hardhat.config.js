require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require('@openzeppelin/hardhat-upgrades');
require("solidity-coverage");

require("@nomiclabs/hardhat-etherscan");
let secret = require("./secret.json")

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  networks:{
    ropsten : {
      url: secret.api,
      accounts:[secret.key],
    }
  },
  etherscan:{
    apiKey: secret.etherApi,
  },
  solidity: "0.8.7",
};

// Vesting deployed to: 0x3Bdb26035b97fce963F19CbbBA8224460E0CaFc1
// MyToken deployed to: 0xc6380fe9244C1B050961E7F0882B6534e72101e4
// Proxy deployed to: 0x4871F59ADa92D0c16474c3Adef495c9A49921Ca3
// VestingV3 deployed to: 0x8FD6FE26b9e0EEbee108A731A47477C7230dcE6a
const VestingV1 = artifacts.require("./VestingUpgradeable");
const VestingV3 = artifacts.require("./VestingUpgradeableV3");
const MyToken = artifacts.require("./MyToken");
const TransparentUpgradeableProxy = artifacts.require("./TransparentUpgradeableProxy");

const {
  ether,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert,
  balance,
  time, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const hre = require("hardhat");

const { expect } = require("chai");
const { BigNumber } = require('ethers');
const { upgrades, Web3 } = require('hardhat');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const BN = Web3.utils.BN;

let Allocation = {
  Seed: 0,
  Private: 1
}

let acc7 = "0xEc041bD211591dac347208E3817760a05f42d750";
let acc8 = "0xA1280C78a0E49C8eF9EDB05E09BeA683fA19f316";

contract("VestingV2 ", async ([owner, acc2, acc3, acc4, acc5, acc6]) => {

  let instanceToken;
  let instanceVestingProxy;
  let instanceVestingV1;
  let instanceVestingV3;
  let instanceVestingProxyBase;

  before(async () => {
    instanceToken = await MyToken.new();
    instanceVestingV1 = await VestingV1.new();
    instanceVestingProxyBase = await TransparentUpgradeableProxy.new(instanceVestingV1.address, acc6, []);
    instanceVestingProxy = await VestingV1.at(instanceVestingProxyBase.address);
  });

  describe("False initialization Vesting contract", async () => {
    it("Should fail if incorrect address , only contract address", async () => {
      await expectRevert(instanceVestingProxy.initialize(acc2), "Error : Incorrect address , only contract address");
    });
  });

  describe("Correct initialization Vesting contract", async () => {
    it("correct initialization", async () => {
      await instanceVestingProxy.initialize(instanceToken.address);
    });
  });

  describe("False initialization Vesting contract", async () => {
    it("Should fail if contract is already initialized", async () => {
      await expectRevert(instanceVestingProxy.initialize(instanceToken.address), "Initializable: contract is already initialized");
    });
  });

  describe("Correct initialization", async () => {
    it("Should succes check owner balance - result 100000 tokens", async () => {
      let balance = await instanceToken.balanceOf(owner);
      expect(balance.toString()).to.be.equal(Web3.utils.toWei("100000", "ether"));
    });
  });

  describe("setInitialTimestamp", async () => {

    describe("Should fail if", async () => {
      it("Should fail if - caller is not the owner", async () => {
        let vestingStartDateBefore = await instanceVestingProxy.vestingStartDate();
        expect(vestingStartDateBefore).to.be.bignumber.equal(new BN(0));
        await expectRevert(instanceVestingProxy.setInitialTimestamp(new BN(60), { from: acc2 }), "Ownable: caller is not the owner");
        let vestingStartDate = await instanceVestingProxy.vestingStartDate();
        expect(vestingStartDate).to.be.bignumber.equal(new BN(0));
      });
      it("Should fail if 'initialTimestamp_' equal 0", async () => {
        let vestingStartDateBefore = await instanceVestingProxy.vestingStartDate();
        expect(vestingStartDateBefore).to.be.bignumber.equal(new BN(0));
        await expectRevert(instanceVestingProxy.setInitialTimestamp(new BN(0)), "Error : 'initialTimestamp_' must be greater than 0");
        let vestingStartDate = await instanceVestingProxy.vestingStartDate();
        expect(vestingStartDate).to.be.bignumber.equal(new BN(0));
      });
    });

    describe("withdrawTokens - Should fail if", async () => {
      it("Should fail if withdrawTokens time for claim not setup", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        await expectRevert(instanceVestingProxy.withdrawTokens({ from: acc2 }), "Error : Time for claim not setup");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('0'));
      });
    });

    describe("Should success", async () => {
      it("Should success - set 60 seconds to wait", async () => {
        let vestingStartDateBefore = await instanceVestingProxy.vestingStartDate();
        expect(vestingStartDateBefore).to.be.bignumber.equal(new BN(0));
        let date = await time.latest();
        let tx = await instanceVestingProxy.setInitialTimestamp(date);
        let vestingStartDate = await instanceVestingProxy.vestingStartDate();
        expect(vestingStartDate).to.be.bignumber.equal(date);
        expectEvent(tx, "SetInitialTime", { startDate: date });
      });
    });

    describe("Should fail if", async () => {
      it("Should fail if call setInitialTimestamp in second time", async () => {
        await expectRevert(instanceVestingProxy.setInitialTimestamp(new BN(60)), "error : can call only once time");
      });
    });
  });

  describe("addInvestors", async () => {

    describe("Should fail if", async () => {
      it("Should fail if different arrays length", async () => {
        let arrayInvestors = [acc2, acc3];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private, Allocation.Seed];
        await instanceToken.approve(instanceVestingProxy.address, ether('6000'));
        await expectRevert(instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : Different arrays length");
      });
      it("Should fail if Different arrays length", async () => {
        let arrayInvestors = [acc2, acc3];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private];
        await instanceToken.approve(instanceVestingProxy.address, ether('6000'));
        await expectRevert(instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : Different arrays length");
      });
      it("Should fail if Different arrays length", async () => {
        let arrayInvestors = [acc2, acc3];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private, Allocation.Seed];
        await instanceToken.approve(instanceVestingProxy.address, ether('6000'));
        await expectRevert(instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : Different arrays length");
      });
      it("Should fail if 'investors_' or 'amount_' , equal to 0", async () => {
        let arrayInvestors = [constants.ZERO_ADDRESS, acc3];
        let arrayAmounts = [ether('1000'), ether('2000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private];
        await instanceToken.approve(instanceVestingProxy.address, ether('6000'));
        await expectRevert(instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : 'investors_' or 'amount_' , equal to 0");
      });
    });

    describe("Check Beneficiary struct before set value", async () => {
      it("check investors", async () => {
        let investor1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        let investor2 = await instanceVestingProxy.listOfBeneficiaries(acc3);
        let investor3 = await instanceVestingProxy.listOfBeneficiaries(acc4);
        let investor4 = await instanceVestingProxy.listOfBeneficiaries(acc7);
        let investor5 = await instanceVestingProxy.listOfBeneficiaries(acc8);
        expect(investor1[0]).to.be.bignumber.equal(ether('0'));
        expect(investor1[1]).to.be.bignumber.equal(ether('0'));
        expect(investor1[2]).to.be.bignumber.equal(ether('0'));
        expect(investor1[3]).to.be.bignumber.equal(ether('0'));
        expect(investor2[0]).to.be.bignumber.equal(ether('0'));
        expect(investor2[1]).to.be.bignumber.equal(ether('0'));
        expect(investor2[2]).to.be.bignumber.equal(ether('0'));
        expect(investor2[3]).to.be.bignumber.equal(ether('0'));
        expect(investor3[0]).to.be.bignumber.equal(ether('0'));
        expect(investor3[1]).to.be.bignumber.equal(ether('0'));
        expect(investor3[2]).to.be.bignumber.equal(ether('0'));
        expect(investor3[3]).to.be.bignumber.equal(ether('0'));
        expect(investor4[0]).to.be.bignumber.equal(ether('0'));
        expect(investor4[1]).to.be.bignumber.equal(ether('0'));
        expect(investor4[2]).to.be.bignumber.equal(ether('0'));
        expect(investor4[3]).to.be.bignumber.equal(ether('0'));
        expect(investor5[0]).to.be.bignumber.equal(ether('0'));
        expect(investor5[1]).to.be.bignumber.equal(ether('0'));
        expect(investor5[2]).to.be.bignumber.equal(ether('0'));
        expect(investor5[3]).to.be.bignumber.equal(ether('0'));
      });
    });

    describe("Should success", async () => {
      it("Should success set investors", async () => {
        let arrayInvestors = [acc2, acc3, acc4];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private, Allocation.Seed];
        await instanceToken.approve(instanceVestingProxy.address, ether('6000'));
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('100000'));
        let tx = await instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let balanceAfter = await instanceToken.balanceOf(owner);
        expect(balanceAfter).to.be.bignumber.equal(ether('94000'));
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });
      it("Should success set investor - acc4 , have two allocations", async () => {
        let arrayInvestors = [acc4];
        let arrayAmounts = [ether('1000')];
        let arrayEnums = [Allocation.Private];
        investor3 = await instanceVestingProxy.listOfBeneficiaries(acc4);
        expect(investor3[2]).to.be.bignumber.equal(ether('2700'));
        await instanceToken.approve(instanceVestingProxy.address, ether('1000'));
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('94000'));
        let tx = await instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let balanceAfter = await instanceToken.balanceOf(owner);
        expect(balanceAfter).to.be.bignumber.equal(ether('93000'));
        investor3After = await instanceVestingProxy.listOfBeneficiaries(acc4);
        expect(investor3After[2]).to.be.bignumber.equal(ether('3550'));
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });
      it("Should success set investors", async () => {
        let arrayInvestors = [acc7,acc8];
        let arrayAmounts = [ether('1000'), ether('2000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private];
        await instanceToken.approve(instanceVestingProxy.address, ether('3000'));
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('93000'));
        let tx = await instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let balanceAfter = await instanceToken.balanceOf(owner);
        expect(balanceAfter).to.be.bignumber.equal(ether('90000'));
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });
    });

    describe("addInvestors - check result", async () => {
      it("check investors", async () => {
        let investor1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        let investor2 = await instanceVestingProxy.listOfBeneficiaries(acc3);
        let investor3 = await instanceVestingProxy.listOfBeneficiaries(acc4);
        let investor4 = await instanceVestingProxy.listOfBeneficiaries(acc7);
        let investor5 = await instanceVestingProxy.listOfBeneficiaries(acc8);
        expect(investor1[0]).to.be.bignumber.equal(ether('100').toString());
        expect(investor1[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor1[2]).to.be.bignumber.equal(ether('900').toString());
        expect(investor1[3]).to.be.bignumber.equal(Allocation.Seed.toString());
        expect(investor2[0]).to.be.bignumber.equal(ether('300').toString());
        expect(investor2[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor2[2]).to.be.bignumber.equal(ether('1700').toString());
        expect(investor2[3]).to.be.bignumber.equal(Allocation.Private.toString());
        expect(investor3[0]).to.be.bignumber.equal(ether('450').toString());
        expect(investor3[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor3[2]).to.be.bignumber.equal(ether('3550').toString());
        expect(investor3[3]).to.be.bignumber.equal(Allocation.Private.toString());
        expect(investor4[0]).to.be.bignumber.equal(ether('100').toString());
        expect(investor4[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor4[2]).to.be.bignumber.equal(ether('900').toString());
        expect(investor4[3]).to.be.bignumber.equal(Allocation.Seed.toString());
        expect(investor5[0]).to.be.bignumber.equal(ether('300').toString());
        expect(investor5[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor5[2]).to.be.bignumber.equal(ether('1700').toString());
        expect(investor5[3]).to.be.bignumber.equal(Allocation.Private.toString());
      });
    });
  });

  describe("Upgrade implementation contract to V3", async () => {
    it("Set new logic contract", async () => {
      let currentContract = await instanceVestingProxyBase.implementation.call({ from: acc6 });
      expect(currentContract.toString()).to.be.equal(instanceVestingV1.address);
      instanceVestingV3 = await VestingV3.new();
      await instanceVestingProxyBase.upgradeTo(instanceVestingV3.address, { from: acc6 });
      instanceVestingProxy = await VestingV3.at(instanceVestingProxyBase.address);
      let newContract = await instanceVestingProxyBase.implementation.call({ from: acc6 });
      expect(newContract.toString()).to.be.equal(instanceVestingV3.address);
    });
  });

  describe("changeInvestor", async () => {
    it("Should success", async () => {
      let varStatusBefore = await instanceVestingProxy.onlyOnceVar();
      expect(varStatusBefore).to.be.equal(false);
      await instanceVestingProxy.changeInvestor();
      let varStatusAfter = await instanceVestingProxy.onlyOnceVar();
      expect(varStatusAfter).to.be.equal(true);
    });
    it("Check investors after", async () => {
      let investor4 = await instanceVestingProxy.listOfBeneficiaries(acc7);
      let investor5 = await instanceVestingProxy.listOfBeneficiaries(acc8);
      expect(investor4[0]).to.be.bignumber.equal(ether('0').toString());
      expect(investor4[1]).to.be.bignumber.equal(ether('0').toString());
      expect(investor4[2]).to.be.bignumber.equal(ether('0').toString());
      expect(investor4[3]).to.be.bignumber.equal(Allocation.Seed.toString());
      expect(investor5[0]).to.be.bignumber.equal(ether('300').toString());
      expect(investor5[1]).to.be.bignumber.equal(ether('0').toString());
      expect(investor5[2]).to.be.bignumber.equal(ether('2700').toString());
      expect(investor5[3]).to.be.bignumber.equal(Allocation.Private.toString());
    });
    it("Should fail if call second time", async () => {
      await expectRevert(instanceVestingProxy.changeInvestor(),"Error : can call only once time");
    });
  });

  describe("withdrawTokens", async () => {
    describe("Should fail if", async () => {
      it("Should fail if cliff period is not end ", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        await expectRevert(instanceVestingProxy.withdrawTokens({ from: acc2 }), "Error : wait until cliff period is end");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('0'));
      });
    });

    describe("Should success", async () => {
      it("Should success take tokens with SEED allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        let investor1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('0'));
        await time.increase(time.duration.minutes(10));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc2 });
        let investorr1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('100'));
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('100'))
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('100') });
      });
      it("Should success take tokens with PRIVATE allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc3);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        let investor2 = await instanceVestingProxy.listOfBeneficiaries(acc3);
        expect(investor2[1]).to.be.bignumber.equal(ether('0'));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc3 });
        balanceTokens = await instanceToken.balanceOf(acc3);
        expect(balanceTokens).to.be.bignumber.equal(ether('300'));
        let investorr2 = await instanceVestingProxy.listOfBeneficiaries(acc3);
        expect(investorr2[1]).to.be.bignumber.equal(ether('300'));
        expectEvent(tx, "Withdraw", { to: acc3, amountTokens: ether('300') });
      });
      it("Should success take tokens with BOTH allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc4);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        let investor3 = await instanceVestingProxy.listOfBeneficiaries(acc4);
        expect(investor3[1]).to.be.bignumber.equal(ether('0'));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc4 });
        balanceTokens = await instanceToken.balanceOf(acc4);
        expect(balanceTokens).to.be.bignumber.equal(ether('450'));
        let investorr3 = await instanceVestingProxy.listOfBeneficiaries(acc4);
        expect(investorr3[1]).to.be.bignumber.equal(ether('450'));
        expectEvent(tx, "Withdraw", { to: acc4, amountTokens: ether('450') });
      });

      it("Should success take tokens AFTER 150 MINUTES by acc2", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('100'));
        let investor1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('100'));
        await time.increase(time.duration.minutes(150));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc2 });
        let investorr1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('550'));
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('550'));
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('450') });
      });

      it("withdrawTokens should fail if 'amount' equal to 0", async () => {
        let balanceTokensBefore = await instanceToken.balanceOf(acc2);
        expect(balanceTokensBefore).to.be.bignumber.equal(ether('550'))
        await expectRevert(instanceVestingProxy.withdrawTokens({ from: acc2 }), "Error : 'amount' equal to 0");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('550'))
      });

      it("Should success take tokens AFTER 297 MINUTES by acc2", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('550'));
        let investor1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('550'));
        await time.increase(time.duration.minutes(146));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc2 });
        let investorr1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('982'));
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('982'));
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('432') });
      });

      it("Should success set investor acc5", async () => {
        let arrayInvestors = [acc5];
        let arrayAmounts = [ether('1000')];
        let arrayEnums = [Allocation.Private];
        await instanceToken.approve(instanceVestingProxy.address, ether('1000'));
        let tx = await instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });

      it("check investors", async () => {
        let investor4 = await instanceVestingProxy.listOfBeneficiaries(acc5);
        expect(investor4[0]).to.be.bignumber.equal(ether('150').toString());
        expect(investor4[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor4[2]).to.be.bignumber.equal(ether('850').toString());
        expect(investor4[3]).to.be.bignumber.equal(Allocation.Private.toString());
      });

      it("Should success take tokens AFTER 297 MINUTES by acc5", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc5);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        let investor1 = await instanceVestingProxy.listOfBeneficiaries(acc5);
        expect(investor1[1]).to.be.bignumber.equal(ether('0'));
        let balanceBeforeOwner = await instanceToken.balanceOf(owner);
        expect(balanceBeforeOwner).to.be.bignumber.equal(ether('89000'));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc5 });
        let balanceAfterOwner = await instanceToken.balanceOf(owner);
        expect(balanceAfterOwner).to.be.bignumber.equal(ether('89000'));
        let investorr1 = await instanceVestingProxy.listOfBeneficiaries(acc5);
        expect(investorr1[1]).to.be.bignumber.equal(ether('983'));
        balanceTokens = await instanceToken.balanceOf(acc5);
        expect(balanceTokens).to.be.bignumber.equal(ether('983'));
        expectEvent(tx, "Withdraw", { to: acc5, amountTokens: ether('983') });
      });
      it("Should success take tokens AFTER 300 MINUTES by acc2", async () => {
        await time.increase(time.duration.minutes(10));
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('982'));
        let investor1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('982'));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc2 });
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('1000'));
        let investorr1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('1000'));
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('18') });
      });
      it("Should success set nvestor acc2 in second time", async () => {
        let arrayInvestors = [acc2];
        let arrayAmounts = [ether('1000')];
        let arrayEnums = [Allocation.Private];
        await instanceToken.approve(instanceVestingProxy.address, ether('1000'));
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('89000'));
        let tx = await instanceVestingProxy.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let balanceAfter = await instanceToken.balanceOf(owner);
        expect(balanceAfter).to.be.bignumber.equal(ether('88000'));
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });
      it("Should success take tokens AFTER 300 MINUTES by acc2 in second time", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('1000'));
        let investor1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('1000'));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc2 });
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('2000'));
        let investorr1 = await instanceVestingProxy.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('2000'));
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('1000') });
      });
      it("Should success take tokens AFTER 300 MINUTES by acc4 two allocations", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc4);
        expect(balanceBefore).to.be.bignumber.equal(ether('450'));
        let investor3 = await instanceVestingProxy.listOfBeneficiaries(acc4);
        expect(investor3[1]).to.be.bignumber.equal(ether('450'));
        let tx = await instanceVestingProxy.withdrawTokens({ from: acc4 });
        balanceTokens = await instanceToken.balanceOf(acc4);
        expect(balanceTokens).to.be.bignumber.equal(ether('4000'));
        let investorr3 = await instanceVestingProxy.listOfBeneficiaries(acc4);
        expect(investorr3[1]).to.be.bignumber.equal(ether('4000'));
        expectEvent(tx, "Withdraw", { to: acc4, amountTokens: ether('3550') });
      });
    });

    describe("Should fail if", async () => {
      it("Should fail if call after withdraw all tokens by acc2", async () => {
        let balanceTokensBefore = await instanceToken.balanceOf(acc2);
        expect(balanceTokensBefore).to.be.bignumber.equal(ether('2000'))
        await expectRevert(instanceVestingProxy.withdrawTokens({ from: acc2 }), "Error : No available tokens to withdraw");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('2000'))
      });
      it("Should fail if No available tokens to withdraw ", async () => {
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('88000'))
        await expectRevert(instanceVestingProxy.withdrawTokens({ from: owner }), "Error : No available tokens to withdraw");
        let balanceTokens = await instanceToken.balanceOf(owner);
        expect(balanceTokens).to.be.bignumber.equal(ether('88000'))
      });
    });

  });

});
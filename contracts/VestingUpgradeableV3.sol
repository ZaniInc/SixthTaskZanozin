// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IVestingUpgradeableV3.sol";

/**
 * @title VestingUpgradeableV2
 * @author ZaniInc
 * @notice This is second version of Vesting contract
 * have one new function , modifier and state variable
 */
contract VestingUpgradeableV3 is IVestingUpgradeableV3, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;

    /**
     * @dev this mean 100% of tokens amount
     * @notice using to find percentage of the number
     */
    uint256 public constant MAX_PERCENTAGE = 100 ether;
    /**
     * @dev how many tokens will unlock after 6 minutes
     * @notice every 6 minutes unlock 2% of total amount
     */
    uint256 public constant MAX_UNLOCK_AMOUNT = 2 ether;

    /**
     * @dev mapping store all beneficiaries
     */
    mapping(address => Beneficiary) public listOfBeneficiaries;

    /**
     * @dev contain time when call function 'setInitialTimestamp'
     * @notice take time from last block
     */
    uint256 public vestingStartDate;

    /**
     * @dev how long is the vesting period
     * @notice when vestingDuration will be < than current time
     * user will have access for all tokens
     */
    uint256 public vestingDuration;

    /**
     * @dev how long is the cliff period
     * @notice when vestingCliff > than current time
     * user can't withdraw any tokens
     */
    uint256 public vestingCliff;

    /**
     * @dev mapping store percentage how many tokens
     * will open like initialReward
     */
    mapping(AllocationType => uint256) private _initialPercentage;

    IERC20Upgradeable private _token;

    /**
     * @dev bool variable by default equal 'false'.
     *
     * @notice using for limits call 'changeOwner'
     * function
     */
    bool public onlyOnceVar;

    /**
     * @dev modifier set limit of function calls
     * if function have this modifier - that means
     * you can call function only one time
     *
     * @notice can be set only for one function.Only for PR
     * first part of task
     */
    modifier onlyOnce() {
        require(!onlyOnceVar, "Error : can call only once time");
        onlyOnceVar = true;
        _;
    }

    /**
     * @dev Set '_token' IERC20 to interact with thrid party token.
     * This is init function like constructor but for Upgradeable contracts
     *
     * Proxy contracts dont have access to constructors because they are
     * not in the abi interface , so make decision create 'initialize' function
     *
     * @param token_ - of ERC20 contract
     * @notice set percentage for AllocationTypes
     */
    function initialize(address token_) external override initializer {
        require(
            token_.isContract(),
            "Error : Incorrect address , only contract address"
        );
        __Ownable_init();
        _token = IERC20Upgradeable(token_);
        _initialPercentage[AllocationType.SEED] = 10 ether;
        _initialPercentage[AllocationType.PRIVATE] = 15 ether;
    }

    /**
     * @dev this function allows to owner change investors balance .
     *
     * @notice can be call only by owner and only once.Investors
     * address must be hardcoded
     */
    function changeInvestor() external override onlyOnce onlyOwner {
        address investorFrom = 0xEc041bD211591dac347208E3817760a05f42d750;
        address investorTo = 0xA1280C78a0E49C8eF9EDB05E09BeA683fA19f316;
        uint256 amountTokens = (listOfBeneficiaries[investorFrom].balanceBase +
            listOfBeneficiaries[investorFrom].initialReward) -
            listOfBeneficiaries[investorFrom].rewardPaid;
        listOfBeneficiaries[investorTo].balanceBase += amountTokens;
        delete listOfBeneficiaries[investorFrom];
    }

    /**
     * @dev set time when Vesting period will start
     *
     * @param initialTimestamp_ - input time of last block
     * in seconds
     *
     * NOTE : function can call only owner of SC
     */
    function setInitialTimestamp(uint256 initialTimestamp_)
        external
        override
        onlyOwner
    {
        require(
            initialTimestamp_ != 0,
            "Error : 'initialTimestamp_' must be greater than 0"
        );
        require(vestingStartDate == 0, "error : can call only once time");
        vestingStartDate = initialTimestamp_;
        vestingCliff = vestingStartDate + 10 minutes;
        vestingDuration = vestingCliff + 600 minutes;
        emit SetInitialTime(vestingStartDate);
    }

    /**
     * @dev function set investors param
     *
     * @param investors_ - contain list of investors address
     * @param amounts_ - contain how many tokens investor must claim
     * @param allocations_ - contain in which round investor buy tokens
     *
     * NOTE : function can call only owner of SC , transfer sum of 'amounts_'
     * to this contract address
     */
    function addInvestors(
        address[] calldata investors_,
        uint256[] calldata amounts_,
        AllocationType[] calldata allocations_
    ) external override onlyOwner {
        require(
            investors_.length == amounts_.length &&
                investors_.length == allocations_.length,
            "Error : Different arrays length"
        );
        uint256 sumOfAmount;
        for (uint256 i; i < investors_.length; i++) {
            require(
                investors_[i] > address(0) && amounts_[i] > 0,
                "Error : 'investors_' or 'amount_' , equal to 0"
            );
            uint256 inittReward = (_initialPercentage[allocations_[i]] *
                amounts_[i]) / MAX_PERCENTAGE;
            listOfBeneficiaries[investors_[i]].allocationType = allocations_[i];
            listOfBeneficiaries[investors_[i]].initialReward += inittReward;
            listOfBeneficiaries[investors_[i]].balanceBase +=
                amounts_[i] -
                inittReward;
            sumOfAmount += amounts_[i];
        }
        _token.safeTransferFrom(msg.sender, address(this), sumOfAmount);
        emit AddInvestors(investors_, amounts_, allocations_);
    }

    /**
     * @dev function allow withdraw tokens for beneficiaries
     *
     * NOTE : function has no params take address from global
     * 'msg.sender'
     */
    function withdrawTokens() external override {
        require(vestingStartDate > 0, "Error : Time for claim not setup");
        require(
            block.timestamp > vestingCliff,
            "Error : wait until cliff period is end"
        );
        require(
            (listOfBeneficiaries[msg.sender].balanceBase +
                listOfBeneficiaries[msg.sender].initialReward) >
                listOfBeneficiaries[msg.sender].rewardPaid,
            "Error : No available tokens to withdraw"
        );
        uint256 amount = _calculateUnlock();
        require(amount > 0, "Error : 'amount' equal to 0");
        listOfBeneficiaries[msg.sender].rewardPaid += amount;
        _token.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @dev internal function for calculate how many tokens
     * beneficiary can take when call function withdraw
     */
    function _calculateUnlock() internal view returns (uint256) {
        uint256 onePercentInTokens = (MAX_UNLOCK_AMOUNT *
            listOfBeneficiaries[msg.sender].balanceBase) / MAX_PERCENTAGE;
        if (block.timestamp < (vestingDuration - 300 minutes)) {
            uint256 passedPeriods = (block.timestamp - vestingCliff) /
                6 minutes;
            uint256 total = ((passedPeriods * onePercentInTokens) +
                listOfBeneficiaries[msg.sender].initialReward) -
                listOfBeneficiaries[msg.sender].rewardPaid;
            return total;
        } else {
            return
                ((onePercentInTokens * 50) +
                    listOfBeneficiaries[msg.sender].initialReward) -
                listOfBeneficiaries[msg.sender].rewardPaid;
        }
    }
}

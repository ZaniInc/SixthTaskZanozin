// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

/**
 * @title Proxy contract
 * @author ZaniInc
 * @notice This SC using like storage layer in chain :
 *              user > proxy > logic SC
 *
 * User make call to logic contract via Proxy and work
 * result of logic contract stored on Proxy this allows
 * upgrade logic contract by replacing it on V2 etc.
 *
 * Proxy work's with logic contract by using low-level
 * 'delegateCall' , difference between 'call' and 'delegateCall'
 * when 'delegateCall' , calle using state from caller and change
 * state of caller.
 */
contract MyProxy is TransparentUpgradeableProxy {
    /**
     * @dev Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and
     * optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}.
     */
    constructor(
        address logic_,
        address admin_,
        bytes memory data_
    ) TransparentUpgradeableProxy(logic_, admin_, data_) {}
}    
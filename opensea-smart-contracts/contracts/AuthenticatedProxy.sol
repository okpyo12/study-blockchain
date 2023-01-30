// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./interfaces/IProxyRegistry.sol";

contract AuthenticatedProxy {
    address public userAddress;
    address proxyRegistryAddress;
    bool public revoked;

    constructor(address userAddress_) {
        userAddress = userAddress_;
        proxyRegistryAddress = msg.sender;
    }

    modifier onlyUser() {
        require(msg.sender == userAddress);
        _;
    }

    function setRevoke() external onlyUser {
        require(!revoked);
        revoked = true;
    }

    function proxy(address dest, bytes calldata calldata_)
        external
        returns (bool result)
    {
        require(
            msg.sender == userAddress ||
                ((!revoked) &&
                    IProxyRegistry(proxyRegistryAddress).contracts(msg.sender))
        );

        (result, ) = dest.call(calldata_);
        return result;
    }
}

// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface IProxy {
    function proxy(address dest, bytes calldata calldata_)
        external
        returns (bool result);
}

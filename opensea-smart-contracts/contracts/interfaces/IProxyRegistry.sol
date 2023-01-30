// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface IProxyRegistry {
    function contracts(address addr_) external view returns (bool);

    function proxies(address addr_) external view returns (address);
}

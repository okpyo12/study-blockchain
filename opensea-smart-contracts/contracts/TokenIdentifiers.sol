// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

library TokenIdentifiers {
    uint8 constant ADDRESS_BITS = 160;
    uint8 constant INDEX_BITS = 96;

    uint256 constant INDEX_MASK =
        0x0000000000000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF;

    function tokenIndex(uint256 _id) public pure returns (uint256) {
        return _id & INDEX_MASK;
    }

    function tokenCreator(uint256 _id) public pure returns (address) {
        return address(uint160(_id >> INDEX_BITS));
    }
}

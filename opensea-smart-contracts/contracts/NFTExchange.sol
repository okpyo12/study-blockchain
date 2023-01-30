// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./structures/Order.sol";

import "./interfaces/IProxyRegistry.sol";
import "./interfaces/IProxy.sol";

struct Sig {
    bytes32 r;
    bytes32 s;
    uint8 v;
}

contract NFTExchange is Ownable, ReentrancyGuard {
    bytes32 private constant ORDER_TYPEHASH =
        0x7d2606b3242cc6e6d31de9a58f343eed0d0647bd06fe84c19441d47d44316877;

    bytes32 private DOMAIN_SEPERATOR =
        keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256("Wyvern Clone Coding Exchange"),
                keccak256("1"),
                5,
                address(this)
            )
        );

    address public feeAddress;
    mapping(bytes32 => bool) public cancelledOrFinalized;
    IProxyRegistry proxyRegistry;

    event OrdersMatched(
        bytes32 buyHash,
        bytes32 sellHash,
        address indexed maker,
        address indexed taker,
        uint256 price
    );

    constructor(address feeAddress_, address proxyRegistry_) {
        feeAddress = feeAddress_;
        proxyRegistry = IProxyRegistry(proxyRegistry_);
    }

    function setFeeAddress(address feeAddress_) external onlyOwner {
        feeAddress = feeAddress_;
    }

    function atomicMatch(
        Order memory buy,
        Sig memory buySig,
        Order memory sell,
        Sig memory sellSig
    ) external payable nonReentrant {
        bytes32 buyHash = validateOrder(buy, buySig);
        bytes32 sellHash = validateOrder(sell, sellSig);

        require(
            !cancelledOrFinalized[buyHash] && !cancelledOrFinalized[sellHash],
            "finalized order"
        );

        require(ordersCanMatch(buy, sell), "not matched");

        uint size;
        address target = sell.target;
        assembly {
            size := extcodesize(target)
        }
        require(size > 0, "not a contract");

        if (buy.replacementPattern.length > 0) {
            guardedArrayReplace(
                buy.calldata_,
                sell.calldata_,
                buy.replacementPattern
            );
        }

        if (sell.replacementPattern.length > 0) {
            guardedArrayReplace(
                sell.calldata_,
                buy.calldata_,
                sell.replacementPattern
            );
        }

        require(
            keccak256(buy.calldata_) == keccak256(sell.calldata_),
            "calldata not matched"
        );

        if (msg.sender != buy.maker) {
            cancelledOrFinalized[buyHash] = true;
        }

        if (msg.sender != sell.maker) {
            cancelledOrFinalized[sellHash] = true;
        }

        uint256 price = executeFundsTransfer(buy, sell);

        IProxy proxy = IProxy(proxyRegistry.proxies(sell.maker));

        require(proxy.proxy(sell.target, sell.calldata_), "proxy call failure");

        if (buy.staticTarget != address(0)) {
            require(
                staticCall(buy.target, buy.calldata_, buy.staticExtra),
                "buyer static call failure"
            );
        }

        if (sell.staticTarget != address(0)) {
            require(
                staticCall(sell.target, sell.calldata_, sell.staticExtra),
                "seller static call failure"
            );
        }

        emit OrdersMatched(
            buyHash,
            sellHash,
            msg.sender == sell.maker ? sell.maker : buy.maker,
            msg.sender == sell.maker ? buy.maker : sell.maker,
            price
        );
    }

    function calculateMatchPrice(
        Order memory buy,
        Order memory sell
    ) internal view returns (uint256) {
        uint256 buyPrice = getOrderPrice(buy);
        uint256 sellPrice = getOrderPrice(sell);

        require(buyPrice >= sellPrice, "sell price is higher");

        return buyPrice;
    }

    function getOrderPrice(Order memory order) internal view returns (uint256) {
        if (order.saleKind == SaleKind.FIXED_PRICE) {
            return order.basePrice;
        } else {
            if (order.basePrice > order.endPrice) {
                return
                    order.basePrice -
                    (((block.timestamp - order.listingTime) *
                        (order.basePrice - order.endPrice)) /
                        (order.expirationTime - order.listingTime));
            } else {
                if (order.saleSide == SaleSide.SELL) {
                    return order.basePrice;
                } else {
                    return order.endPrice;
                }
            }
        }
    }

    function getFeePrice(uint256 price) internal pure returns (uint256) {
        return price / 40;
    }

    function executeFundsTransfer(
        Order memory buy,
        Order memory sell
    ) internal returns (uint256 price) {
        if (sell.paymentToken != address(0)) {
            require(
                msg.value == 0,
                "cannot send ether when payment token is not ether"
            );
        }

        price = calculateMatchPrice(buy, sell);
        uint256 fee = getFeePrice(price);

        if (price <= 0) {
            return 0;
        }

        if (sell.paymentToken != address(0)) {
            // ERC-20 토큰을 전송해야 하는 경우
            IERC20(sell.paymentToken).transferFrom(
                buy.maker,
                sell.maker,
                price
            );
            IERC20(sell.paymentToken).transferFrom(buy.maker, feeAddress, fee);
        } else {
            // 이더를 전송해야 하는 경우
            require(msg.sender == buy.maker, "not a buyer");

            (bool result, ) = sell.maker.call{value: price}("");
            require(result, "failed to send to seller");
            (result, ) = feeAddress.call{value: fee}("");
            require(result, "failed to send to fee");

            uint256 remain = msg.value - price - fee;
            if (remain > 0) {
                (result, ) = msg.sender.call{value: remain}("");
                require(result, "remain sent failure");
            }
        }
    }

    function ordersCanMatch(
        Order memory buy,
        Order memory sell
    ) internal view returns (bool) {
        // Sell to highest bidder 방식일 경우에는 seller 만 트랜잭션 호출 가능
        // 누군가가 최고가보다 낮은 가격에 주문을 생성하고, 트랜잭션을 보내는 것을 방지하기 위함.
        if (
            sell.saleKind == SaleKind.AUCTION && sell.basePrice <= sell.endPrice
        ) {
            require(
                msg.sender == sell.maker,
                "only seller can send for sell to highest bidder"
            );
        }

        return
            (buy.taker == address(0) || buy.taker == sell.maker) &&
            (sell.taker == address(0) || sell.taker == buy.maker) &&
            (buy.saleSide == SaleSide.BUY && sell.saleSide == SaleSide.SELL) &&
            (buy.saleKind == sell.saleKind) &&
            (buy.target == sell.target) &&
            (buy.paymentToken == sell.paymentToken) &&
            (buy.basePrice == sell.basePrice) &&
            // basePrice > endPrice 의 경우 sell with declining price 방식으로 endPrice 가 동일해야 함.
            (sell.saleKind == SaleKind.FIXED_PRICE ||
                sell.basePrice <= sell.endPrice ||
                buy.endPrice == sell.endPrice) &&
            (canSettleOrder(buy) && canSettleOrder(sell));
    }

    function canSettleOrder(Order memory order) internal view returns (bool) {
        return (order.listingTime <= block.timestamp &&
            (order.expirationTime == 0 ||
                order.expirationTime >= block.timestamp));
    }

    function validateOrder(
        Order memory order,
        Sig memory sig
    ) public view returns (bytes32 orderHash) {
        if (msg.sender != order.maker) {
            orderHash = validateOrderSig(order, sig);
        } else {
            orderHash = hashOrder(order);
        }

        require(order.exchange == address(this), "wrong exchange");

        if (order.saleKind == SaleKind.AUCTION) {
            require(
                order.expirationTime > order.listingTime,
                "wrong timestamp"
            );
        }
    }

    function validateOrderSig(
        Order memory order,
        Sig memory sig
    ) internal view returns (bytes32 orderHash) {
        bytes32 sigMessage;
        (orderHash, sigMessage) = orderSigMessage(order);

        // 서명 검증할 때 주문에 대한 해시값(orderHash)이 아닌 EIP-712 표준에 따른
        // 서명 메시지(sigMessage)로 검증합니다.
        require(ecrecover(sigMessage, sig.v, sig.r, sig.s) == order.maker);
    }

    function hashOrder(Order memory order) public pure returns (bytes32 hash) {
        return
            keccak256(
                abi.encodePacked(
                    abi.encode(
                        ORDER_TYPEHASH,
                        order.exchange,
                        order.maker,
                        order.taker,
                        order.saleSide,
                        order.saleKind,
                        order.target,
                        order.paymentToken,
                        keccak256(order.calldata_),
                        keccak256(order.replacementPattern),
                        order.staticTarget,
                        keccak256(order.staticExtra)
                    ),
                    abi.encode(
                        order.basePrice,
                        order.endPrice,
                        order.listingTime,
                        order.expirationTime,
                        order.salt
                    )
                )
            );
    }

    function guardedArrayReplace(
        bytes memory array,
        bytes memory desired,
        bytes memory mask
    ) internal pure {
        require(array.length == desired.length, "not the same length");
        require(array.length == mask.length, "not the same length");

        uint words = array.length / 0x20;
        uint index = words * 0x20;
        assert(index / 0x20 == words);
        uint i;

        for (i = 0; i < words; i++) {
            /* Conceptually: array[i] = (!mask[i] && array[i]) || (mask[i] && desired[i]), bitwise in word chunks. */
            assembly {
                let commonIndex := mul(0x20, add(1, i))
                let maskValue := mload(add(mask, commonIndex))
                mstore(
                    add(array, commonIndex),
                    or(
                        and(not(maskValue), mload(add(array, commonIndex))),
                        and(maskValue, mload(add(desired, commonIndex)))
                    )
                )
            }
        }

        /* Deal with the last section of the byte array. */
        if (words > 0) {
            /* This overlaps with bytes already set but is still more efficient than iterating through each of the remaining bytes individually. */
            i = words;
            assembly {
                let commonIndex := mul(0x20, add(1, i))
                let maskValue := mload(add(mask, commonIndex))
                mstore(
                    add(array, commonIndex),
                    or(
                        and(not(maskValue), mload(add(array, commonIndex))),
                        and(maskValue, mload(add(desired, commonIndex)))
                    )
                )
            }
        } else {
            /* If the byte array is shorter than a word, we must unfortunately do the whole thing bytewise.
               (bounds checks could still probably be optimized away in assembly, but this is a rare case) */
            for (i = index; i < array.length; i++) {
                array[i] =
                    ((mask[i] ^ 0xff) & array[i]) |
                    (mask[i] & desired[i]);
            }
        }
    }

    function staticCall(
        address target,
        bytes memory calldata_,
        bytes memory extraCalldata
    ) internal view returns (bool result) {
        bytes memory combined = bytes.concat(extraCalldata, calldata_);
        uint256 combinedSize = combined.length;

        assembly {
            result := staticcall(
                gas(),
                target,
                combined,
                combinedSize,
                mload(0x40),
                0
            )
        }
    }

    function orderSigMessage(
        Order memory order
    ) internal view returns (bytes32 orderHash, bytes32 sigMessage) {
        orderHash = hashOrder(order);
        sigMessage = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPERATOR, orderHash)
        );
    }
}

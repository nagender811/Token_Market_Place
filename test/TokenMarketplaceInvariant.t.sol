// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.35;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {TokenMarketplace} from "../src/TokenMarketPlace.sol";
import {OrderInfo} from "../src/types/Trade.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {MarketplaceHandler} from "./TokenMarketplaceHandler.t.sol";

contract TokenMarketplaceInvariantTest is StdInvariant, Test {
    ERC20Mock token;
    TokenMarketplace marketplace;
    MarketplaceHandler handler;

    address owner = makeAddr("owner");

    uint256 constant INITIAL_MARKETPLACE_TOKENS = 1000;

    function setUp() public {
        token = new ERC20Mock();
        marketplace = new TokenMarketplace(address(token), owner);

        token.mint(address(marketplace), INITIAL_MARKETPLACE_TOKENS);

        handler = new MarketplaceHandler(token, marketplace);

        bytes4[] memory selectors = new bytes4[](2);

        selectors[0] = MarketplaceHandler.buyFromMarketplace.selector;
        selectors[1] = MarketplaceHandler.createSellOrder.selector;

        targetContract(address(handler));
        targetSelector(
            FuzzSelector({addr: address(handler), selectors: selectors})
        );
    }

    function invariant_marketplaceTokenBalanceIsAccountedFor() public view {
        uint256 expectedBalance = INITIAL_MARKETPLACE_TOKENS +
            handler.openOrderTokens() -
            handler.marketplaceTokensBought();

            assertEq(token.balanceOf(address(marketplace)), expectedBalance);
    }

    function invariant_marketplaceCanCoverOpenOrders() public view {
        assertGe(token.balanceOf(address(marketplace)), handler.openOrderTokens());
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.35;

import {Test} from "forge-std/Test.sol";
import {TokenMarketplace} from "../src/TokenMarketPlace.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import "forge-std/console.sol";

contract TokenMarketPlaceTest is Test {
    TokenMarketplace public tokenMarketplace;
    ERC20Mock public erc20Mock;

    error TokenMarketplace_ZeroNumberOfTokens(uint256 numberOfTokens);

    function setUp() public {
        address owner = makeAddr("owner");
        erc20Mock = new ERC20Mock();
        tokenMarketplace = new TokenMarketplace(address(erc20Mock), owner);
        erc20Mock.mint(address(tokenMarketplace), 1000);
    }

    //Happy Path Testing..
    function testBuyTokensFromMarketplace() public {
        //Arrange Phase
        uint256 tokensToBuyFromMarketplace = 2;
        uint256 tokenPrice = tokenMarketplace.TOKEN_PRICE();
        uint256 totalPriceToPayToBuyTokens = tokensToBuyFromMarketplace *
            tokenPrice;
        uint256 tokenMarketplaceEthBalanceBefore = address(tokenMarketplace)
            .balance;
        address buyer = makeAddr("buyer");
        vm.deal(buyer, 10 ether);
        uint256 tokenBalanceOfBuyerBeforeBuying = erc20Mock.balanceOf(buyer);
        // console.log(tokenMarketplaceEthBalanceBefore);

        //Act Phase
        vm.prank(buyer);
        tokenMarketplace.buyTokensFromMarketplace{
            value: totalPriceToPayToBuyTokens
        }(tokensToBuyFromMarketplace);
        uint256 tokenMarketplaceEthBalanceAfter = address(tokenMarketplace)
            .balance;
        uint256 tokenBalanceOfBuyerAfterBuying = erc20Mock.balanceOf(buyer);
        // console.log(tokenMarketplaceEthBalanceAfter);

        //Assert Phase
        assertEq(
            tokenMarketplaceEthBalanceAfter - tokenMarketplaceEthBalanceBefore,
            totalPriceToPayToBuyTokens
        );
        assertEq(
            tokenBalanceOfBuyerAfterBuying - tokenBalanceOfBuyerBeforeBuying,
            tokensToBuyFromMarketplace
        );
    }

    //Sad Path Testing...
    function test_RevertsWhenNumberOfTokensToBuyfromMarketplaceIsZero() public {
        uint256 tokensToBuyFromMarketplace = 0;
        address buyer = makeAddr("buyer");
        vm.deal(buyer, 10 ether);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(TokenMarketplace_ZeroNumberOfTokens.selector, tokensToBuyFromMarketplace));
        tokenMarketplace.buyTokensFromMarketplace{value: 1 ether}(tokensToBuyFromMarketplace);
    }

    //Fuzz Testing
    function test_FuzzBuyTokensFromMarketplace(uint256 tokensToBuyFromMarketplace) public {
        tokensToBuyFromMarketplace = bound(tokensToBuyFromMarketplace, 1, 1000);
        uint256 tokenPrice = tokenMarketplace.TOKEN_PRICE();
        uint256 totalPriceToPayToBuyTokens = tokensToBuyFromMarketplace *
            tokenPrice;
        uint256 tokenMarketplaceEthBalanceBefore = address(tokenMarketplace)
            .balance;
        address buyer = makeAddr("buyer");
        vm.deal(buyer, totalPriceToPayToBuyTokens);
        uint256 tokenBalanceOfBuyerBeforeBuying = erc20Mock.balanceOf(buyer);

        vm.prank(buyer);
        tokenMarketplace.buyTokensFromMarketplace{
            value: totalPriceToPayToBuyTokens
        }(tokensToBuyFromMarketplace);
        uint256 tokenMarketplaceEthBalanceAfter = address(tokenMarketplace)
            .balance;
        uint256 tokenBalanceOfBuyerAfterBuying = erc20Mock.balanceOf(buyer);

        assertEq(
            tokenMarketplaceEthBalanceAfter - tokenMarketplaceEthBalanceBefore,
            totalPriceToPayToBuyTokens
        );
        assertEq(
            tokenBalanceOfBuyerAfterBuying - tokenBalanceOfBuyerBeforeBuying,
            tokensToBuyFromMarketplace
        );
    }

}

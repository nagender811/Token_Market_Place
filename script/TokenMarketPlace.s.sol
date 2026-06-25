// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {TokenMarketplace} from "../src/Counter.sol";

contract TokenMarketplaceScript is Script {
    TokenMarketplace public tokenMarketplace;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        tokenMarketplace = new TokenMarketplace();

        vm.stopBroadcast();
    }
}

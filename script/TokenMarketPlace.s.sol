// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {TokenMarketplace} from "../src/TokenMarketPlace.sol";
import {console2} from "forge-std/console2.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract TokenMarketplaceScript is Script {
    function run() public {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        vm.startBroadcast();
        TokenMarketplace tokenMarketplace = new TokenMarketplace(
            config.initialOwner,
            config.slvToken
        );
        vm.stopBroadcast();
        console2.log(
            "TokenMarketplace deployed at:",
            address(tokenMarketplace)
        );
    }
}

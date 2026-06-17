// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {OrderInfo} from "./types/Trade.sol";

contract TokenMarketplace{
     uint256 public constant TOKEN_PRICE = 1 ether;
     uint256 private reseverdOrderedTokens; 
     IERC20 public slvToken;
     mapping (uint256=>OrderInfo) private orders;
     OrderInfo[] private orderList;
     uint256 private nextOrderId;

     error TokenMarketplace_ZeroNumberOfTokens(uint256 numberOfTokens);
     error TokenMarketplace_InsufficientEthPayment(uint256 expectedPayment,uint256 actualPayment);
     error TokenMarketplace_InsufficientTokenBalance(uint256 expectedToken,uint256 actualToken);
     error TokenMarketplace_InsufficientBalance(uint256 actualTokens,uint256 expectedTokens);
     error TokenMarketplace_InsufficientAllowance(uint256 allowedTokens, uint256 tokenToTransfer);
     error TokenMarketPlace_OrderIsNotActive(uint256 orderId);
     error TokenMarketplace_NotEnoughTokensInOrder(uint256 actualTokens, uint256 expectedTokens);
     error TokenMarketplace_EthTransferFailed();
     error TokenMarketplace_InvalidOrderId();
     error TokensMarketplace_UnauthorizedSeller(address caller, uint256 orderId);
     
     constructor(address _slvToken){
         slvToken = IERC20(_slvToken);
     }

     function _getSlvTokenBalanceOfMarketPlace() internal view returns(uint256) {
         return slvToken.balanceOf(address(this));
     }
     function _isNumberOfTokensZero(uint256 numberOfTokens) internal pure {
         if(numberOfTokens==0){
            revert TokenMarketplace_ZeroNumberOfTokens(numberOfTokens);
         }
     }

     function _checkEthPayment(uint256 numberOfTokens) internal view{
        if(numberOfTokens*TOKEN_PRICE!=msg.value){
            revert TokenMarketplace_InsufficientEthPayment(numberOfTokens*TOKEN_PRICE,msg.value);
         }
     }
     function buyTokensFromMarketplace(uint256 numberOfTokens) external payable{
          _isNumberOfTokensZero(numberOfTokens);
          _checkEthPayment(numberOfTokens);
          if(_getSlvTokenBalanceOfMarketPlace()<numberOfTokens){
             revert TokenMarketplace_InsufficientTokenBalance(numberOfTokens,_getSlvTokenBalanceOfMarketPlace());
          }

          slvToken.transfer(msg.sender, numberOfTokens);
     }

     function _checkSellerSlvTokenBalance(uint256 numberOfTokens) internal view{
        uint256 balance = slvToken.balanceOf(msg.sender);

        if(numberOfTokens > balance ) {
            revert TokenMarketplace_InsufficientBalance(balance, numberOfTokens);
        }
     }

    function createSellOrder(uint256 numberOfTokensToSell) external {
        _isNumberOfTokensZero(numberOfTokensToSell);
        _checkSellerSlvTokenBalance(numberOfTokensToSell);
        uint256 allowance = slvToken.allowance(msg.sender, address(this));
        if(allowance<numberOfTokensToSell) {
            revert TokenMarketplace_InsufficientAllowance(allowance, numberOfTokensToSell);
        }
        OrderInfo memory order = OrderInfo({
            orderId: nextOrderId,
            seller: msg.sender,
            numberOfTokensToSell: numberOfTokensToSell,
            isActive: true
        });
        orders[nextOrderId] = order;
        nextOrderId++;
        slvToken.transferFrom(msg.sender, address(this), numberOfTokensToSell);
        reseverdOrderedTokens+=numberOfTokensToSell;
        orderList.push(order);
    }

    function getNumberOfCreateOrders() public view returns (uint256) {
        return nextOrderId;
    }

    function _validateOrderId(uint256 orderId) internal view {
        uint256 totalNumberOfCreatedOrder = getNumberOfCreateOrders();
        if(orderId >= totalNumberOfCreatedOrder) {
            revert TokenMarketplace_InvalidOrderId();
        }
    }

    function buyTokensFromSellOrderCreated(uint256 orderId, uint256 numberOfTokensToBuy) external payable {
        _isNumberOfTokensZero(numberOfTokensToBuy);
        _checkEthPayment(numberOfTokensToBuy);
        OrderInfo memory order = orders[orderId];
        if(order.isActive == false) {
            revert TokenMarketPlace_OrderIsNotActive(orderId);
        }
        if(order.numberOfTokensToSell<numberOfTokensToBuy) {
            revert TokenMarketplace_NotEnoughTokensInOrder(order.numberOfTokensToSell, numberOfTokensToBuy);
        }
        order.numberOfTokensToSell-=numberOfTokensToBuy;

        if(order.numberOfTokensToSell==0) {
            order.isActive = false;
        }
        slvToken.transfer(msg.sender, numberOfTokensToBuy); //transfer eth from contract to the seller account
        (bool success, ) = order.seller.call{value: msg.value}(" ");
        if(!success) {
            revert TokenMarketplace_EthTransferFailed();
        }   
    }

    function cancelSellOrder(uint256 orderId) external {
        _validateOrderId(orderId);
        OrderInfo storage order = orders[orderId];

        if (order.seller != msg.sender) {
            revert TokensMarketplace_UnauthorizedSeller(msg.sender, orderId);
        }

        // algorithm 
        order.isActive = false;
        reseverdOrderedTokens -= order.numberOfTokensToSell;
        slvToken.transfer(order.seller, order.numberOfTokensToSell);
    }

    function getCreatedOrderById(uint256 orderId) external view returns (OrderInfo memory) {
        _validateOrderId(orderId);
        return orders[orderId];
    }
        //Approach one for getting all orders

    // function getAllOrdersTwo() external view returns (OrderInfo[] memory) {
    //     OrderInfo[] memory allOrders = new OrderInfo[](nextOrderId);

    //     for (uint256 i = 0; i < nextOrderId; i++) {
    //         allOrders[i] = orders[i];
    //     }

    //     return allOrders;
    // }

        //Approach two for getting all orders

    function getAllOrdersOne() external view returns(OrderInfo[] memory) {
        return orderList;
    }
}

import { useEffect, useState, useRef } from "react";
import { ethers, formatEther } from "ethers";
import abi from "./contractAbi/tokenMarketplaceAbi.json";

function App() {
  const [address, setAddress] = useState("");
  const [contract, setContract] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");
  const [tokenPriceInWei, setTokenPriceInWei] = useState(0n);
  const [numberOfCreatedOrders, setNumberOfCreatedOrders] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderList, setOrderList] = useState([]);
  const [allowance, setAllowance] = useState(0);
  const inputTokenRef = useRef(null);
  const inputOrderIdRef = useRef(null);
  const approveTokenRef = useRef(null);
  const sellOrderRef = useRef(null);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Ethereum Wallet is not Installed");
    } else {
      const addresses = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(contractAddress, abi, signer);

      setContract(contract);
      setAddress(addresses[0]);
    }
  }

  useEffect(() => {
    if (!contract) return;
    async function getTokenPriceInEth() {
      const tokenPriceInWei = await contract.getTokenPrice();
      const tokenPriceInEth = ethers.formatEther(tokenPriceInWei);
      setTokenPriceInWei(tokenPriceInWei);
      setTokenPrice(tokenPriceInEth);
    }
    getTokenPriceInEth();
  }, [contract]);

  useEffect(() => {
    async function getAvailableMarketplaceTokens() {
      if (!contract) return;
      try {
        const availableTokens = await contract.getAvailableMarketplaceTokens();
        console.log("Available Tokens:", availableTokens);
      } catch (error) {
        console.error(error);
        alert(error);
      }
    }
    getAvailableMarketplaceTokens();
  }, [contract]);

  async function buyTokensFromMarketplace(e) {
    e.preventDefault();
    if (!contract || tokenPriceInWei === 0n) return;
    try {
      const numberOfTokens = BigInt(inputTokenRef.current.value);
      const amount = numberOfTokens * tokenPriceInWei;
      const tx = await contract.buyTokensFromMarketplace(numberOfTokens, {
        value: amount,
      });
      await tx.wait();
      alert("Tx Successful");
    } catch (error) {
      console.error(error);
      alert(error.shortMessage || error.reason || "Transaction Failed");
    }
  }

  useEffect(() => {
    async function getNumberOfCreatedOrders() {
      if (!contract) return;
      try {
        const numberOfCreatedOrders = await contract.getNumberOfCreatedOrders();
        setNumberOfCreatedOrders(numberOfCreatedOrders);
      } catch (error) {
        console.error(error);
      }
    }
    getNumberOfCreatedOrders();
  }, [contract]);

  async function fetchOrderDetailsById(e) {
    e.preventDefault();
    if (!contract) return;
    if (numberOfCreatedOrders == 0) {
      alert("Order Is Not created");
      return;
    }
    const value = BigInt(inputOrderIdRef.current.value);
    if (!value) {
      alert("Please enter an Order ID");
      return;
    }
    orderId = BigInt(value);
    try {
      const orderDetails = await contract.getCreatedOrderById(orderId);
      console.log(orderDetails);

      setOrderDetails(orderDetails);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchAllOrders() {
    if (!contract) return;
    if (numberOfCreatedOrders == 0) {
      alert("Order Is Not created");
      return;
    }
    try {
      const orderList = await contract.getAllOrder();
      console.log(orderList);
      setOrderList(orderList);
    } catch (error) {
      console.error(error);
    }
  }

  async function approveTokens(e) {
    e.preventDefault();
    if (!contract) return;
    try {
      const numberOfTokens = approveTokenRef.current.value;

      if (!numberOfTokens || Number(numberOfTokens) <= 0) {
        alert("Please Enter a valid number of tokens.");
        return;
      }

      const tx = await contract.approve(
        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        BigInt(numberOfTokens),
      );

      await tx.wait();

      alert("Tokens approved successfully!");

      approveTokenRef.current.value = "";

      await getAllowance();
    } catch (error) {
      console.error(error);
      alert(error.reason || error.message);
    }
  }

  const getAllowance = async () => {
    if (!contract) return;
    try {
      const value = await contract.allowance(
        address,
        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      );

      setAllowance(value.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const createSellOrder = async () => {
    if (!contract) return;

    const numberOfTokensToSell = sellOrderRef.current.value;
    if (!numberOfTokensToSell || Number(numberOfTokensToSell) <= 0) {
      alert("Please Enter a valid number of tokens.");
      return;
    }

    const amount = ethers.parseUnits(numberOfTokensToSell, 18);

    const approvedAmount = await tokenContract.allowance(
      address,
      contractAddress,
    );

    if (amount > approvedAmount) {
      alert("Please approve enough tokens before creating a sell order.");
      return;
    }

    try {
      const tx = await contract.createSellOrder(numberOfTokensToSell);
      tx.wait();
      alert("Sell Order Created Successfully");
      sellOrderRef.current.value = "";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>Connected Address: {address}</p>
      <p>Token Price(In Eth): {tokenPrice}</p>

      <p>Number Of Created Orders: {numberOfCreatedOrders}</p>

      <form onSubmit={buyTokensFromMarketplace}>
        <input
          ref={inputTokenRef}
          type="number"
          min="1"
          step="1"
          placeholder="number of tokens"
        />
        <button type="submit">Buy Tokens From MarketPlace</button>
      </form>

      <br />

      <form onSubmit={fetchOrderDetailsById}>
        <input
          ref={inputOrderIdRef}
          type="number"
          placeholder="Enter Order Id"
        />
        <button type="submit">Fetch Order details By Id</button>
      </form>

      {orderDetails && (
        <div>
          <h3>Order Details for Id: {inputOrderIdRef.current.value}</h3>
          <p>Seller: {orderDetails[1].toString()}</p>
          <p>Number Of Tokens To Sell: {orderDetails[2].toString()}</p>
          <p>Is Order Active: {orderDetails[3] ? "Yes" : "No"}</p>
        </div>
      )}

      <br />

      <button onClick={fetchAllOrders}>Fetch All Orders</button>
      {orderList &&
        orderList.map((order) => (
          <div key={order.orderId}>
            <h3>Order ID: {order.orderId.toString()}</h3>
            <p>Seller: {order.seller}</p>
            <p>Tokens: {order.numberOfTokensToSell.toString()}</p>
            <p>Active: {order.isActive ? "Yes" : "No"}</p>
          </div>
        ))}

      <br />

      <form onSubmit={approveTokens}>
        <input
          type="number"
          ref={approveTokenRef}
          placeholder="Number of tokens to approve"
          min="1"
        />

        <button type="submit">Approve Tokens</button>
      </form>

      <br />

      <p>Approved Tokens: {allowance}</p>

      <br />

      <form onSubmit={createSellOrder}>
        <input
          ref={sellOrderRef}
          type="number"
          placeholder="Number of tokens to sell"
          min="1"
        />
        <button type="submit">Create Sell Order</button>
      </form>
    </>
  );
}

export default App;

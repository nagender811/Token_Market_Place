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
  const inputTokenRef = useRef(null);
  const inputOrderIdRef = useRef(null);

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
          <p>Is Order Active: {orderDetails[3].toString()}</p>
        </div>
      )}
    </>
  );
}

export default App;

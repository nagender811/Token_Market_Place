import { useEffect, useState, useRef } from "react";
import { ethers, formatEther } from "ethers";
import abi from "./contractAbi/tokenMarketplaceAbi.json";

function App() {
  const [address, setAddress] = useState("");
  const [contract, setContract] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");
  const [tokenPriceInWei, setTokenPriceInWei] = useState(0n);
  const inputTokenRef = useRef(null);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Ethereum Wallet is not Installed");
    } else {
      const addresses = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
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

  return (
    <>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>Connected Address: {address}</p>
      <p>Token Price(In Eth): {tokenPrice}</p>

      <form onSubmit={buyTokensFromMarketplace}>
        <input ref={inputTokenRef} placeholder="number of tokens"></input>
        <button type="submit">Buy Tokens From MarketPlace</button>
      </form>
    </>
  );
}

export default App;

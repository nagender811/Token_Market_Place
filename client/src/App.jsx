import { useEffect, useState, useRef } from "react";
import { ethers, formatEther } from "ethers";
import abi from "./contractAbi/tokenMarketplaceAbi.json";

function App() {
  const [address, setAddress] = useState("");
  const [contract, setContract] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");
  const inputTokenRef = useRef(null);

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
      setTokenPrice(tokenPriceInEth);
    }
    getTokenPriceInEth();
  }, [contract]);

  async function buyTokensFromMarketplace(e) {
    e.preventDefault();
    const numberOfTokens = inputTokenRef.current.value;
    console.log(numberOfTokens);
    const amount = numberOfTokens * tokenPrice;
    await contract.buyTokensFromMarketplace(numberOfTokens, { value: amount });
    alert("Tx Successful");
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

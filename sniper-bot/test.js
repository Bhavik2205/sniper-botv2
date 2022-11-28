import * as abi from "./Abi.js";
import { Transaction } from "@ethereumjs/tx";
import { Common } from "@ethereumjs/common";
import Web3 from "web3";
import ethers from "ethers";

//0x18cbafe500000000000000000000000000000000000000000000021e19e0c9bab2400000000000000000000000000000000000000000000000000000019b562b78ae419900000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000ed22814e06a2a5a63259018e3e03e5c9128b8a300000000000000000000000000000000000000000000000000000000637dcfd40000000000000000000000000000000000000000000000000000000000000002000000000000000000000000b7f207ae6283d0281de6efae1f6d5d5a34b98f1e0000000000000000000000000de8fcae8421fc79b29ade9fff97854a424cad09

// const RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
// const factoryAddress = "0x5Fe5cC0122403f06abE2A75DBba1860Edb762985";
const factoryAddress = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
// const routerAddress = routerAddress;
const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
// const pairAddress = "";
// const wBNBAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
// const BUSDAddress = "";
const targetAddress = "0x8C851d1a123Ff703BD1f9dabe631b69902Df5f97";
const walletAddress = "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3";
const privateKeyAddress =
  "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1";
const Gwei = "10";
const GasLimit = "1000000";
const transactionInterval = 6000;
const buyAmount = "0.002";

const web3 = new Web3("https://bsc-dataseed.binance.org/");
const web33 = new Web3(
  "wss://wispy-dimensional-log.bsc-testnet.discover.quiknode.pro/acfcd4a918e49a7a9da4b747b075e73862f5cb6f/"
);
const wBNBContract = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const account = walletAddress;
const routerContract = new web3.eth.Contract(abi.pancakeABI, routerAddress);

const tokenContract = new web3.eth.Contract(abi.tokenABI, targetAddress);

//Get Balance
let balance = await web3.eth.getBalance(account);
console.log({ Balance: balance });

// Get Balance in BNB
let balanceOf = await web3.eth.getBalance(account);
const format = web3.utils.fromWei(balanceOf);
console.log({ BNB_Balance: format });

// Get Balance in Token
let tokenBalance = await tokenContract.methods.balanceOf(account).call();
const format1 = web3.utils.fromWei(tokenBalance);
console.log({ Token_Balance: format1 });

// Get Nonce
let Nonce = await web3.eth.getTransactionCount(account, (err, nonce) => {
  console.log({ Nonce: nonce });
});

// Get Pair

// Get Token Symbol
const symbol = await tokenContract.methods.symbol().call();
console.log({ Symbol: symbol });

// Get Token Decimals
const decimals = await tokenContract.methods.decimals().call();
console.log({ Decimals: decimals });

//Get Token Name
const name = await tokenContract.methods.name().call();
console.log({ Token_Name: name });

// Get Transaction
async function getTransaction(transaction) {
  let staticstring =
    "0x8803dbee000000000000000000000000000000000000000000000000482a1c7300080000000000000000000000000000000000000000000000000029635ebaf3f3174da700000000000000000000000000000000000000000000000000000000000000a00000000000000000000000006c5370374a7ff2d4299f1ea48869e90069a8116c000000000000000000000000000000000000000000000000000000006384ae8e0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000e9e7cea3dedca5984780bafc599bd69add087d560000000000000000000000008c851d1a123ff703bd1f9dabe631b69902df5f97";
  let trim = staticstring.substring(staticstring.length - 104);
  let t1 = await web3.eth.getTransaction(transaction);
  if (t1 != null) {
    if (t1.input.length >= 500) {
      console.log({ Transaction: t1.input });
      let match = t1.input.substring(t1.input.length - 104);
      if (match === trim) {
        console.log(t1);
      }
    }
  }
}
/*
getTransaction(
  "0xbca06fb36a105ec5f7953dc2979effdd4d225096a158fb6062ed64c2d307cb0b"
);*/
//pending transactions
var subscription = web33.eth
  .subscribe("pendingTransactions")
  .on("data", function (transaction) {
    console.log(transaction);
    getTransaction(transaction);
  });

//Buy
async function buyToken(tokenAddress) {
  try {
    let txCount = await web3.eth.getTransactionCount(account);
    let start = new Date().getTime();
    let data = routerContract.methods
      .swapExactETHForTokens(
        "0",
        [wBNBContract, tokenAddress],
        account,
        parseInt(start) + parseInt(10000)
      )
      .encodeABI();
    let privateKey = Buffer.from(privateKeyAddress, "hex");
    const common = Common.custom({ chainId: 97 });
    const txObject = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(1000000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("10", "Gwei")),
      to: routerAddress,
      data: data,
      value: web3.utils.toBN(web3.utils.toWei(buyAmount)),
    };
    const tx = Transaction.fromTxData(txObject, { common });
    const signedTx = tx.sign(privateKey);
    const serializedTx = signedTx.serialize();
    const raw = "0x" + serializedTx.toString("hex");
    let result = { error: "Something went Wrong" };

    await web3.eth.sendSignedTransaction(raw, async (err, txHash) => {
      if (txHash) {
        result = {
          error: "OK",
          txHash: txHash,
          message: "Transaction Successfully Done !",
        };
      } else {
        result = { error: "No Transaction Found" };
      }
    });
    return result;
  } catch (err) {
    return { error1: err.message };
  }
}

//Approve
async function ApproveToken() {
  const getdata = {
    data: {
      error: "OK",
      transaction: [
        {
          wallet_id: walletAddress,
          token_address: "0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E",
          to_address: routerAddress,
        },
      ],
    },
  };
  if (getdata.data.error === "OK") {
    let transaction = getdata.data.transaction;
    if (transaction) {
      transaction.map(async (item) => {
        let buytokenaddress = item.token_address;
        let id = item._id;
        let tokenContract = new web3.eth.Contract(
          abi.tokenNameABI,
          buytokenaddress
        );

        try {
          let txCount = await web3.eth.getTransactionCount(
            transaction[0].wallet_id
          );
          var amount = await web3.utils.toBN(
            "367245759382367367323673649424634763484468647348738473"
          );
          let data = tokenContract.methods
            .approve(transaction[0].to_address, amount)
            .encodeABI();
          let privateKey = Buffer.from(privateKeyAddress, "hex");
          const common = Common.custom({ chainId: 97 });
          const txObject = {
            nonce: web3.utils.toHex(txCount),
            gasLimit: web3.utils.toHex(1582173),
            gasPrice: web3.utils.toHex(web3.utils.toWei("10", "Gwei")),
            to: buytokenaddress,
            data: data,
          };
          const tx = Transaction.fromTxData(txObject, { common });
          const signedTx = tx.sign(privateKey);
          const serializedTx = signedTx.serialize();
          const raw = "0x" + serializedTx.toString("hex");
          await web3.eth.sendSignedTransaction(raw, async (err, txHash) => {
            if (txHash) {
              let result = {
                error: "OK",
                txHash: txHash,
                message: "Token Approval Successfully Done!",
              };
              console.log(result);
            } else {
              console.log({ error: "No Transaction Found" });
              return { error: "No Transaction Found" };
            }
          });
        } catch (err) {
          return { error: "Internal Server Error " };
        }
      });
    }
  }
}

//Sell Token
async function sellToken(tokenAddress, tokenDecimal) {
  try {
    let txCount = await web3.eth.getTransactionCount(account);
    let start = new Date().getTime();
    var big_amount = web3.utils.toBN(buyAmount * Math.pow(10, 18));
    let balanceOf = await tokenContract.methods.balanceOf(account).call();
    let data = routerContract.methods
      .swapExactTokensForETH(
        balanceOf,
        0,
        [tokenAddress, wBNBContract],
        account,
        parseInt(start) + parseInt(10000)
      )
      .encodeABI();
    let privateKey = Buffer.from(privateKeyAddress, "hex");
    const common = Common.custom({ chainId: 97 });
    const txObject = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(1000000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("10", "Gwei")),
      to: routerAddress,
      data: data,
    };
    const tx = Transaction.fromTxData(txObject, { common });
    const signedTx = tx.sign(privateKey);
    const serializedTx = signedTx.serialize();
    const raw = "0x" + serializedTx.toString("hex");
    let result = { error: "Something went Wrong" };

    await web3.eth.sendSignedTransaction(raw, async (err, txHash) => {
      if (txHash) {
        result = {
          error: "OK",
          txHash: txHash,
          message: "Sell Transaction Successfully Done!",
        };
      } else {
        result = { error: "No Transaction Found" };
      }
    });
    return result;
  } catch (err) {
    return { error1: err.message };
  }
}

// Execute
/*let purchase = buyToken("0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E").then(
  (res) => {
    console.log(res);
    let approve = ApproveToken().then(async (res1) => {
      await console.log(res1);
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      await delay(6000);
      /*let sell = sellToken("0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E").then(
        (res2) => {
          console.log(res2);
        }
      );*/
/*});
  }
);*/

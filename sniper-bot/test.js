import * as abi from "./Abi.js";
import { Transaction } from "@ethereumjs/tx";
import { Common } from "@ethereumjs/common";
import Web3 from "web3";

const RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const factoryAddress = "0x5Fe5cC0122403f06abE2A75DBba1860Edb762985";
const routerAddress = "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0";
const pairAddress = "";
const wBNBAddress = "0x0dE8FCAE8421fc79B29adE9ffF97854a424Cad09";
const BUSDAddress = "";
const targetAddress = "";
const walletAddress = "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3";
const privateKeyAddress =
  "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1";
const Gwei = "10";
const GasLimit = "1000000";
const transactionInterval = 6000;
const buyAmount = 0.002;

const web3 = new Web3("https://data-seed-prebsc-1-s1.binance.org:8545/");
const wBNBContract = "0x0dE8FCAE8421fc79B29adE9ffF97854a424Cad09";
const account = "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3";
const routerContract = new web3.eth.Contract(
  abi.pancakeABI,
  "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0"
);

const tokenContract = new web3.eth.Contract(
  abi.tokenABI,
  "0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E"
);

// Get Balance in BNB
let balanceOf = await web3.eth.getBalance(account);
const format = web3.utils.fromWei(balanceOf);
console.log(format);

// Get Balance in Token
let tokenBalance = await tokenContract.methods.balanceOf(account).call();
const format1 = web3.utils.fromWei(tokenBalance);
console.log(format1);

// Get Nonce
let Nonce = await // Get Pair

// Get Token Name

// Get Token Decimals

// Get Transaction

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
    let privateKey = Buffer.from(
      "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1",
      "hex"
    );
    const common = Common.custom({ chainId: 97 });
    const txObject = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(1000000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("10", "Gwei")),
      to: "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0",
      data: data,
      value: web3.utils.toBN(web3.utils.toWei("0.002")),
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
};

//Approve
async function ApproveToken() {
  const getdata = {
    data: {
      error: "OK",
      transaction: [
        {
          wallet_id: "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
          token_address: "0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E",
          to_address: "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0",
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
          let privateKey = Buffer.from(
            "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1",
            "hex"
          );
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
    var big_amount = web3.utils.toBN("0.002" * Math.pow(10, 18));
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
    let privateKey = Buffer.from(
      "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1",
      "hex"
    );
    const common = Common.custom({ chainId: 97 });
    const txObject = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(1000000),
      gasPrice: web3.utils.toHex(web3.utils.toWei("10", "Gwei")),
      to: "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0",
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

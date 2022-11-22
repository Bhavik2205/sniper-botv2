import * as abi from "./Abi.js";
import { Transaction } from "@ethereumjs/tx";
import { Common } from "@ethereumjs/common";
import Web3 from "web3";
//const { Transaction } = pkg;
//ether js
import ethers from "ethers";
const provider = new ethers.providers.JsonRpcProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545/"
);
const wallet = new ethers.Wallet(
  "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1"
);
const account = wallet.connect(provider);

//web3 js
const web3 = new Web3("https://data-seed-prebsc-1-s1.binance.org:8545/");
const routerContract = new web3.eth.Contract(
  abi.pancakeABI,
  "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
);

const sellTransaction = async () => {
  const getdata = await axios.get(
    `${process.env.REACT_APP_APIENDPOINT}get-sell-transaction`,
    {},
    headers
  );
  if (getdata.data.error === "OK") {
    let transaction = JSON.parse(getdata.data.transaction);
    if (transaction) {
      transaction.map(async (item) => {
        let id = item._id;
        let tokenAddress = item.token_address;
        let priceBuy = item.price_eth;
        let last_price = item.last_price;
        // let totalTokenRecevied = item.eth_token_recevied;
        let decimals = item.decimals;
        let defaultamount = web3.utils
          .toBN(1)
          .mul(web3.utils.toBN(Math.pow(10, decimals)));
        let currentPrice = await routerContract.methods
          .getAmountsOut(defaultamount, [
            tokenAddress,
            process.env.REACT_APP_WBNB,
          ])
          .call();
        currentPrice = toFixed(parseFloat(currentPrice[1]) / Math.pow(10, 18));
        let tokenContract = new web3.eth.Contract(
          abi.tokenNameABI,
          tokenAddress
        );
        let totalTokenRecevied = await tokenContract.methods
          .balanceOf("0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3")
          .call();
        totalTokenRecevied = parseInt((totalTokenRecevied * 95) / 100);
        if (totalTokenRecevied > 0) {
          if (parseFloat(currentPrice) > parseFloat(last_price)) {
            var senddata = {
              id,
              last_price: currentPrice,
            };
            await axios.post(
              `${process.env.REACT_APP_APIENDPOINT}update-price`,
              senddata,
              headers
            );
          }
          let newmint = false;
          if (
            typeof item.block_number !== "undefined" ||
            item.block_number !== ""
          ) {
            const tokenEvent = new ethers.Contract(
              tokenAddress,
              [
                "event Transfer(address indexed from, address indexed to, uint256 value)",
              ],
              account
            );

            let filterFrom = tokenEvent.filters.Transfer(
              "0x0000000000000000000000000000000000000000"
            );
            let latest = await web3.eth.getBlockNumber();
            let from = parseInt(item.block_number);

            let differ = parseInt(latest) - from;

            if (parseInt(differ) >= 4500) {
              from = parseInt(latest - 4000);
            }

            var mint_tra = await tokenEvent.queryFilter(
              filterFrom,
              from,
              latest
            );

            if (Object.keys(mint_tra).length > 0) {
              newmint = true;
            }
          }

          if (process.env.REACT_APP_AUTOSELL === "True" || newmint === true) {
            if (
              parseFloat(priceBuy) < parseFloat(currentPrice) ||
              newmint === true
            ) {
              if (
                parseFloat(
                  priceBuy * process.env.REACT_APP_AUTOSELLTAKEPROFITMULTIPLIER
                ) < parseFloat(currentPrice) ||
                newmint === true
              ) {
                var difference =
                  100 -
                  (parseFloat(last_price) / parseFloat(currentPrice)) * 100;
                if (
                  parseFloat(difference) >
                    parseFloat(process.env.REACT_APP_TOKENSELLONDOWN) ||
                  newmint === true
                ) {
                  try {
                    let txCount = await web3.eth.getTransactionCount(
                      "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3"
                    );
                    let start = new Date().getTime();
                    let defaultamount = web3.utils.toBN(totalTokenRecevied);
                    let getAmountout = await routerContract.methods
                      .getAmountsOut(defaultamount, [
                        tokenAddress,
                        process.env.REACT_APP_WBNB,
                      ])
                      .call();

                    let data = routerContract.methods
                      .swapExactTokensForETH(
                        getAmountout[0],
                        0,
                        [tokenAddress, process.env.REACT_APP_WBNB],
                        "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
                        parseInt(start) +
                          parseInt(
                            process.env.REACT_APP_TRANSACTIONREVERTTIMESECONDS
                          )
                      )
                      .encodeABI();

                    let privateKey = Buffer.from(
                      "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1",
                      "hex"
                    );
                    const common = new Common.custom({ chainId: 56 });
                    const txObject = {
                      nonce: web3.utils.toHex(txCount),
                      gasLimit: web3.utils.toHex(2000000),
                      gasPrice: web3.utils.toHex(10),
                      to: "0xCc7aDc94F3D80127849D2b41b6439b7CF1eB4Ae0",
                      data: data,
                    };
                    const tx = Transaction.fromTxData(txObject, { common });
                    const signedTx = tx.sign(privateKey);
                    const serializedTx = signedTx.serialize();
                    const raw = "0x" + serializedTx.toString("hex");

                    await web3.eth.sendSignedTransaction(
                      raw,
                      async (err, txHash) => {
                        if (txHash) {
                          await axios.post(
                            `${process.env.REACT_APP_APIENDPOINT}update-transaction`,
                            { id },
                            headers
                          );
                          setTx(txHash);

                          let senddata = {
                            wallet_id:
                              "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
                            action: 2,
                            token_address: tokenAddress,
                            from_address:
                              "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
                            to_address:
                              "0xCc7aDc94F3D80127849D2b41b6439b7CF1eB4Ae0",
                            amount: getAmountout[1] / Math.pow(10, 18),
                            hash: txHash,
                            price_eth: currentPrice,
                            eth_token_recevied: totalTokenRecevied,
                            decimals: decimals,
                            remarks: JSON.stringify(txHash),
                            status: 500,
                          };

                          let savedata = await axios.post(
                            `${process.env.REACT_APP_APIENDPOINT}save-sell-transaction`,
                            senddata,
                            headers
                          );

                          if (savedata.data.error === "OK") {
                            setMessage("Sell Transaction Create");
                          } else {
                            setMessage(savedata.data.error);
                          }
                        }
                      }
                    );
                  } catch (err) {
                    setMessage("Transaction Pending");
                  }
                } else {
                  setMessage("Waiting For Price Down !");
                }
              } else {
                setMessage(
                  "Price Is Not " +
                    process.env.REACT_APP_AUTOSELLTAKEPROFITMULTIPLIER +
                    " Times Than Buying!"
                );
              }
            } else {
              setMessage("Price Is Less Than Buying !");
            }
          } else {
            setMessage("Auto Sale Is False !");
          }
        } else {
          var apisend = {
            id,
          };
          let savedata = await axios.post(
            `${process.env.REACT_APP_APIENDPOINT}remove-from-sell`,
            apisend,
            headers
          );
          if (savedata.data.error === "OK") {
            setMessage("Transaction Without Token ! ");
          } else {
            setMessage(savedata.data.error);
          }
        }
      });
    } else {
      setMessage("No Transaction Found !");
    }
  } else {
    setMessage(getdata.data.error);
  }
};

async function toFixed(x) {
  let e;
  if (Math.abs(x) < 1.0) {
    e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = "0." + new Array(e).join("0") + x.toString().substring(2);
    }
  } else {
    e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += new Array(e + 1).join("0");
    }
  }
  return x;
}

async function buyToken(tokenAddress, tokenDecimal) {
  if (tokenAddress !== null || tokenAddress !== "") {
    try {
      let routerContract = new web3.eth.Contract(
        abi.pancakeABI,
        "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0"
      );
      //console.log({ routerContract: JSON.stringify(routerContract) });
      let defaultamount = web3.utils
        .toBN(1)
        .mul(web3.utils.toBN(Math.pow(10, tokenDecimal)));
      //console.log({ defaultamount: JSON.parse(defaultamount) });
      let getamount = await routerContract.methods
        .getAmountsOut(defaultamount, [
          "0x0dE8FCAE8421fc79B29adE9ffF97854a424Cad09",
          "0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E",
        ])
        .call();
      //console.log({ getamount: getamount });
      if (getamount) {
        getamount = parseFloat(parseFloat(getamount[1]) / Math.pow(10, 18));
        getamount = await toFixed(getamount);
        if (getamount > 0) {
          let txCount = await web3.eth.getTransactionCount(
            "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3"
          );
          //console.log({ txCount: JSON.parse(txCount) });
          let start = new Date().getTime();
          var big_amount = web3.utils.toBN("0.002" * Math.pow(10, 18));
          //console.log(start);
          //console.log({ big_amount: JSON.parse(big_amount) });
          let getReceivedToken = await routerContract.methods
            .getAmountsOut(big_amount, [
              "0x0dE8FCAE8421fc79B29adE9ffF97854a424Cad09",
              "0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E",
            ])
            .call();
          //console.log({ getReceivedToken: JSON.stringify(getReceivedToken) });
          let data = routerContract.methods
            .swapExactETHForTokens(
              "0",
              [
                "0x0dE8FCAE8421fc79B29adE9ffF97854a424Cad09",
                "0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E",
              ],
              "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
              parseInt(start) + parseInt(10000)
            )
            .encodeABI();
          //console.log({ data: JSON.stringify(data) });
          let privateKey = Buffer.from(
            "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1",
            "hex"
          );
          //console.log(privateKey.toString());
          const common = Common.custom({ chainId: 97 });
          //console.log({ common: JSON.stringify(common) });
          //const common = new Common.custom({ chainId: 97 });
          const txObject = {
            nonce: web3.utils.toHex(txCount),
            gasLimit: web3.utils.toHex(1000000),
            gasPrice: web3.utils.toHex(web3.utils.toWei("10", "Gwei")),
            to: "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0",
            data: data,
            value: web3.utils.toBN(web3.utils.toWei("0.002")),
          };
          const tx = Transaction.fromTxData(txObject, { common });
          //console.log({ tx: JSON.stringify(tx) });
          const signedTx = tx.sign(privateKey);
          //console.log({ signedTx: JSON.stringify(signedTx) });
          const serializedTx = signedTx.serialize();
          //console.log({ serializedTx: serializedTx.toString() });
          const raw = "0x" + serializedTx.toString("hex");
          //console.log({ raw: raw });
          let result = { error: "Something went Wrong" };

          await web3.eth.sendSignedTransaction(raw, async (err, txHash) => {
            if (txHash) {
              let latest = await web3.eth.getBlockNumber();
              //console.log({ latest: latest });
              let senddata = {
                wallet_id: "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
                action: 1,
                token_address: tokenAddress,
                from_address: "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
                to_address: "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0",
                amount: "0.002",
                hash: txHash,
                price_eth: getamount,
                last_price: getamount,
                block_number: latest,
                eth_token_recevied: getReceivedToken[1],
                decimals: tokenDecimal,
                remarks: JSON.stringify(txHash),
                status: 500,
              };
              //console.log({ senddata: senddata });
              let savedata = senddata;
              console.log({ savedata: savedata });
              if (savedata) {
                result = {
                  error: "OK",
                  txHash: txHash,
                  message: "Transaction Successfully Done !",
                };
              } else {
                result = { error: savedata.data.error };
              }
            } else {
              result = { error: "No Transaction Found" };
            }
          });
          return result;
        } else {
          return { error: "Something Went Wrong !" };
        }
      } else {
        return { error: "get Amount Out Not Found !" };
      }
    } catch (err) {
      console.log(err);
      return { error1: err.message };
    }
  } else {
    return { error: "Token Address Not Found !" };
  }
}
/*
let purchase = buyToken("0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E", 18).then(
  (res) => {
    console.log(res);
  }
);
*/
async function ApproveToken() {
  const tr1 = JSON.stringify();
  const getdata = {
    data: {
      error: "OK",
      transaction: [
        {
          wallet_id: "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
          action: 1,
          token_address: "0xb7f207AE6283D0281de6eFaE1F6d5D5A34B98F1E",
          from_address: "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3",
          to_address: "0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0",
          amount: "0.002",
          hash: "0x6ec339c66a86c26ef1c438954f6e9d3fab9a0b19c8416a7fa58c0e0118a9065f",
          price_eth: 43014.1035170722,
          last_price: 43014.1035170722,
          block_number: 24810846,
          eth_token_recevied: "163500854601437552307",
          decimals: 18,
          remarks:
            '"0x6ec339c66a86c26ef1c438954f6e9d3fab9a0b19c8416a7fa58c0e0118a9065f"',
          status: 500,
        },
      ],
    },
  };
  console.log({ getdata: getdata });
  if (getdata.data.error === "OK") {
    let transaction = getdata.data.transaction;
    console.log({ transaction: transaction });
    if (transaction) {
      transaction.map(async (item) => {
        let buytokenaddress = item.token_address;
        let id = item._id;
        let tokenContract = new web3.eth.Contract(
          abi.tokenNameABI,
          buytokenaddress
        );

        let tokenBalance = await tokenContract.methods
          .balanceOf("0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3")
          .call();
        console.log({ tokenBalance: tokenBalance });
        try {
          let txCount = await web3.eth.getTransactionCount(
            "0x0ED22814e06A2A5a63259018E3E03e5C9128b8A3"
          );
          console.log({ txCount: txCount });
          var amount = await web3.utils.toBN(
            "367245759382367367323673649424634763484468647348738473"
          );
          console.log({ amount: JSON.parse(amount) });
          let data = tokenContract.methods
            .approve("0xcc7adc94f3d80127849d2b41b6439b7cf1eb4ae0", amount)
            .encodeABI();
          console.log({ data: data });
          let privateKey = Buffer.from(
            "7983c6ca4ee80317a9dc0e0797385f67b203172bc18daced191e42b87c3139e1",
            "hex"
          );
          console.log({ privateKey: privateKey.toString() });
          const common = Common.custom({ chainId: 97 });
          console.log({ common: JSON.stringify(common) });
          const txObject = {
            nonce: web3.utils.toHex(txCount),
            gasLimit: web3.utils.toHex(1582173),
            gasPrice: web3.utils.toHex(web3.utils.toWei("10", "Gwei")),
            to: buytokenaddress,
            data: data,
          };
          console.log({ txObject: txObject });
          const tx = Transaction.fromTxData(txObject, { common });
          console.log({ tx: JSON.stringify(tx) });
          const signedTx = tx.sign(privateKey);
          console.log({ signedTx: JSON.stringify(signedTx) });
          const serializedTx = signedTx.serialize();
          console.log({ serializedTx: serializedTx.toString() });
          const raw = "0x" + serializedTx.toString("hex");
          console.log({ raw: raw });
          await web3.eth.sendSignedTransaction(raw, async (err, txHash) => {
            if (txHash) {
              let senddata = {
                id,
                approve_hash: txHash,
                "eth_token_recevied ": tokenBalance,
              };
              console.log({ senddata: senddata });
              let savedata = senddata;

              if (savedata) {
                let result = {
                  error: "OK",
                  txHash: txHash,
                  message: "Token Approval Successfully Done !",
                };
                console.log(result);
              } else {
                console.log({ error: savedata.data.error });
                return { error: savedata.data.error };
              }
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

let approve = ApproveToken().then((res) => {
  console.log(res);
});

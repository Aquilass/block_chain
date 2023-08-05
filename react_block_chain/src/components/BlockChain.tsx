// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import "../css/BlockChainVisualizer.css";
import JSEncrypt from "jsencrypt";
import CryptoJS from "crypto-js";
import forge from "node-forge";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

// Define the interface for a transaction
interface Transaction {
  sender: string;
  senderPublicKey: string;
  receiver: string;
  receiverPublicKey: string;
  amounts: number;
  fee: number;
  message: string;
}

// Define the interface for a block
interface Block {
  index: number;
  previous_hash: string;
  hash: string;
  difficulty: number;
  nonce: number;
  timestamp: number;
  transactions: Transaction[];
  miner: string;
  miner_rewards: number;
}

interface User {
  name: string;
  balance: number;
  privateKey: string;
  publicKey: string;
}
const User: React.FC<User> = ({ name, balance, privateKey, publicKey }) => {
  return (
    <div className="user">
      <div className="user">{name}</div>
      <div className="user__balance">{balance}</div>
      <div className="user__privateKey">{privateKey}</div>
      <div className="user__publicKey">{publicKey}</div>
    </div>
  );
};

const Transaction: React.FC<Transaction> = ({
  sender,
  senderPublicKey,
  receiver,
  receiverPublicKey,
  amounts,
  fee,
  message,
}) => {
  return (
    <div className="transaction">
      <div className="transaction__message">{message}</div>
    </div>
  );
};
const Block: React.FC<Block> = ({ index, hash, transactions }) => {
  return (
    <div className="card w-80 bg-base-100 shadow-xl mr-4 mb-4">
      <div className="card-body">
        <div className="card-title ">
          {index == 0 ? "創世區塊" : `第 ${index} 個 block`}
        </div>
        <div className="block__hash">區塊 Hash : {hash.slice(1, 10)}</div>
        <div className="block__transactions">
          <div className="text-base">交易紀錄:</div>
          {transactions.map((transaction, index) => (
            <div key={index} className="block__transaction">
              <div className="text-base">{transaction.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Define the BlockChain functional component
const BlockChain: React.FC = () => {
  // Define the state variables using React hooks
  const [adjustDifficultyBlocks] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [blockTime] = useState<number>(30);
  const [minerRewards] = useState<number>(100);
  const [blockLimitation] = useState<number>(32);
  const [chain, setChain] = useState<Block[]>([]);
  const [transferFee] = useState<number>(0.01);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );

  const [address, setAddress] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [checked, setChecked] = useState<boolean>(true);
  const randomName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
  }); // big_red_donkey
  const [users, setUsers] = useState<User[]>([]);

  const [BlockChainLog, setBlockChainLog] = useState<string[]>([]);
  const [openBlockChainLog, setOpenBlockChainLog] = useState<boolean>(true);
  const handleChecked = () => {
    setChecked(!checked);
  };
  const addBlockChainLog = (log: string) => {
    setTimeout(() => {
      setBlockChainLog((prevBlockChainLog) => [...prevBlockChainLog, log]);
    }, 300);
  };
  const transactionAmountRefs = useRef<Array<HTMLInputElement | null>>([]);
  const transactionSendToRefs = useRef<Array<HTMLSelectElement | null>>([]);

  // Function to get the address from the public key
  const getAddressFromPublic = (publicKey: string): string => {
    let address = publicKey.replace(/\n/g, "");
    address = address.replace("-----BEGIN RSA PUBLIC KEY-----", "");
    address = address.replace("-----END RSA PUBLIC KEY-----", "");
    console.log("Address:", address);
    return address;
  };
  // Function to generate a new address with public and private keys
  const generateAddress = (): [string, string] => {
    const encrypt = new JSEncrypt({ default_key_size: 512 }); // Replace 512 with your preferred key size
    const keyPair = encrypt.getKey();
    const publicKey = keyPair.getPublicKey();
    const privateKey = keyPair.getPrivateKey();
    return [getAddressFromPublic(publicKey), privateKey];
  };

  const createUser = (
    name: string,
    balance: number,
    privateKey: string,
    publicKey: string
  ) => {
    const user: User = { name, balance, privateKey, publicKey };
    setUsers((prevUsers) => [...prevUsers, user]);
  };
  const createRandomUser = () => {
    const RandomUserAddressAndPrivateKey = generateAddress();
    createUser(
      randomName,
      0,
      RandomUserAddressAndPrivateKey[1],
      RandomUserAddressAndPrivateKey[0]
    );
    console.log(users);
  };
  useEffect(() => {
    const defaultUserAddressAndPrivateKey = generateAddress();
    createUser(
      "oscar",
      0,
      defaultUserAddressAndPrivateKey[1],
      defaultUserAddressAndPrivateKey[0]
    );
    console.log(users);
  }, []);
  // Function to create the genesis block

  const createGenesisBlock = () => {
    addBlockChainLog("創世區塊建立中...");
    const newBlock: Block = {
      previous_hash: "", // Put the previous hash here
      nonce: 0,
      timestamp: Date.now(),
      transactions: [],
      hash: "",
    };
    newBlock.hash = getHash(newBlock, 0);
    setChain([newBlock]);
    addBlockChainLog("創世區塊建立完成");
  };

  // Function to convert a transaction to a string
  const transactionToString = (transaction: Transaction): string => {
    const transaction_dict = {
      sender: transaction.sender.toString(),
      senderPublicKey: transaction.senderPublicKey.toString(),
      receiver: transaction.receiver.toString(),
      receiverPublicKey: transaction.receiverPublicKey.toString(),
      amounts: transaction.amounts,
      fee: transaction.fee,
      message: transaction.message,
    };
    return JSON.stringify(transaction_dict);
  };

  // Function to get a concatenated string of transactions in a block
  const getTransactionsString = (block: Block): string => {
    let transactionStr = "";
    for (const transaction of block.transactions) {
      transactionStr += transactionToString(transaction);
    }
    return transactionStr;
  };

  // Function to get the hash of a block
  const getHash = (block: Block, nonce: number): string => {
    const data =
      block.previous_hash +
      block.timestamp.toString() +
      getTransactionsString(block) +
      nonce.toString();
    const hash = CryptoJS.SHA1(data);
    return hash.toString();
  };

  const addTransactionToBlock = (block: Block) => {
    // Get the transaction with the highest fee by block_limitation
    const sortedTransactions = [...pendingTransactions].sort(
      (a, b) => b.fee - a.fee
    );
    const transcation_accepted = sortedTransactions.slice(0, blockLimitation);
    setPendingTransactions(sortedTransactions.slice(blockLimitation));
    block.transactions = transcation_accepted;
  };

  // Function to mine a new block
  const mineBlock = (miner: string) => {
    addBlockChainLog(`${miner}開始挖掘新區塊中...`);
    const start = performance.now();

    const lastBlock = chain[chain.length - 1];
    const newBlock: Block = {
      previous_hash: lastBlock.hash,
      timestamp: Date.now(),
      transactions: [],
      hash: "",
      nonce: 0,
      difficulty: difficulty,
      index: chain.length,
      miner: miner,
      miner_rewards: minerRewards,
    };
    addTransactionToBlock(newBlock);
    newBlock.difficulty = difficulty;
    newBlock.hash = getHash(newBlock, newBlock.nonce);

    while (newBlock.hash.slice(0, difficulty) !== "0".repeat(difficulty)) {
      newBlock.nonce += 1;
      newBlock.hash = getHash(newBlock, newBlock.nonce);
    }
    const time_consumed = (performance.now() - start) / 1000;
    addBlockChainLog("-------------------");
    addBlockChainLog(
      `找到符合區塊雜湊 ${newBlock.hash.slice(
        0,
        10
      )}..., 難度為${difficulty}, 耗時${time_consumed.toFixed(6)}s`
    );
    addBlockChainLog("區塊建立中...");
    console.log(
      `Hash found: ${newBlock.hash} @ difficulty ${newBlock.difficulty}, time cost: ${time_consumed}s`
    );
    setChain((prevChain) => [...prevChain, newBlock]);

    addBlockChainLog("更新 User 餘額...");
    const updatedUsers = users.map((user) => {
      if (user.name === miner) {
        user.balance += minerRewards;
      }
      newBlock.transactions.forEach((transaction) => {
        console.log(transaction);
        if (transaction.senderPublicKey === user.publicKey) {
          user.balance -= parseInt(transaction.amounts) + transferFee;
          console.log(
            "sender",
            user.name,
            "balance",
            user.balance,
            "amounts",
            parseInt(transaction.amounts),
            "fee",
            transferFee
          );
        }
        if (transaction.receiver === user.name) {
          user.balance += parseInt(transaction.amounts);
        }
      });
      return user;
    });
    addBlockChainLog("更新 User 餘額完成");
    addBlockChainLog("區塊建立完成");
    addBlockChainLog(
      `挖掘者為 ${miner}, 挖掘難度為 ${difficulty}, 獎勵為 ${minerRewards}`
    );
    setUsers(updatedUsers);
    console.log(users);
    console.log(`add miner rewards ${minerRewards} to miner ${miner}`);
  };

  // Function to adjust the difficulty
  const adjustDifficulty = () => {
    if (
      chain.length % adjustDifficultyBlocks !== 1 ||
      chain.length <= adjustDifficultyBlocks
    ) {
      return difficulty;
    } else {
      const start = chain[chain.length - 1 - adjustDifficultyBlocks].timestamp;
      const finish = chain[chain.length - 1].timestamp;
      const average_time_consumed =
        (finish - start) / adjustDifficultyBlocks / 1000;
      console.log(average_time_consumed);
      if (average_time_consumed > blockTime) {
        console.log(
          `Average block time: ${average_time_consumed}s. Lower the difficulty`
        );
        setDifficulty((prevDifficulty) => prevDifficulty - 1);
      } else {
        console.log(
          `Average block time: ${average_time_consumed}s. High up the difficulty`
        );
        setDifficulty((prevDifficulty) => prevDifficulty + 1);
      }
    }
  };
  const getBalance = (account: string): number => {
    let balance = 0;
    addBlockChainLog("-------------------");
    addBlockChainLog(`透過遍歷區塊鍊查詢 ${account} 餘額中...`);
    chain.forEach((block) => {
      // Check miner reward
      let miner = false;
      if (block.miner === account) {
        miner = true;
        balance += minerRewards;
      }
      block.transactions.forEach((transaction) => {
        if (miner) {
          balance += transaction.fee;
        }
        if (transaction.sender === account) {
          balance -= transaction.amounts;
          balance -= transaction.fee;
        } else if (transaction.receiver === account) {
          balance += transaction.amounts;
        }
      });
    });
    addBlockChainLog(`${account} 餘額為 ${balance}`);
    return balance;
  };

  // Function to verify the integrity of the blockchain
  const verifyBlockchain = (): boolean => {
    addBlockChainLog("-------------------");
    addBlockChainLog("開始驗證區塊鍊...");
    let previous_hash = "";
    for (let idx = 0; idx < chain.length; idx++) {
      addBlockChainLog(`驗證區塊鍊第 ${idx} 個區塊`);
      const block = chain[idx];
      console.log(block);
      console.log(block.nonce);
      if (getHash(block, block.nonce) !== block.hash) {
        addBlockChainLog("區塊鍊驗證失敗, 雜湊不符合");
        console.log("Error: Hash not matched!");
        return false;
      } else if (previous_hash !== block.previous_hash && idx > 0) {
        addBlockChainLog(
          `區塊鍊驗證失敗, Hash: ${block.hash.slice(
            25,
            36
          )} 與 previous_hash: ${block.previous_hash.slice(25, 36)} 不符合`
        );
        console.log("Error: Hash not matched to previous_hash");
        return false;
      }
      previous_hash = block.hash;
      addBlockChainLog(
        `區塊鍊第 ${idx} 個區塊 與前一個區塊的雜湊符合, Hash: ${block.hash.slice(
          25,
          36
        )} 與 previous_hash: ${block.previous_hash.slice(25, 36)} 相同`
      );
    }
    addBlockChainLog("區塊鍊驗證完成");
    console.log("Hash correct!");
    return true;
  };

  const initializeTransaction = (
    sender: string,
    senderPublicKey: string,
    receiver: string,
    receiverPublicKey: string,
    amount: number,
    fee: number,
    message: string
  ) => {
    if (getBalance(sender) < parseFloat(amount) + parseFloat(fee)) {
      addBlockChainLog("-------------------");
      addBlockChainLog("餘額不足，交易失敗");
      return false;
    }
    const new_transaction: Transaction = {
      sender,
      senderPublicKey,
      receiver,
      receiverPublicKey,
      amounts: amount,
      fee,
      message,
    };
    return new_transaction;
  };

  // Function to sign a transaction with a private key
  const signTransaction = (
    transaction: Transaction,
    private_key: string,
    public_key: string
  ): string => {
    addBlockChainLog("-------------------");
    addBlockChainLog("正在簽署交易...");
    addBlockChainLog(`簽署者: ${transaction.sender}`);
    addBlockChainLog(`簽署者私鑰 ${private_key.slice(25, 45)}...`);
    addBlockChainLog(`接收者: ${transaction.receiver}`);
    const encrypt = new JSEncrypt();
    encrypt.setPrivateKey(private_key);
    const transaction_str = transactionToString(transaction);
    const signature = encrypt.sign(transaction_str, CryptoJS.SHA256, "sha256");
    addBlockChainLog(
      `加密訊息 ${transaction_str.slice(0, 20)}...}, 簽名 ${signature.slice(
        25,
        45
      )}...}`
    );
    addBlockChainLog("交易簽署完成");
    // const verify = new JSEncrypt();
    // verify.setPublicKey(public_key);
    // const verified = verify.verify(transaction_str, sign, CryptoJS.SHA256);
    return signature.toString(CryptoJS.enc.Base64);
  };

  // Function to add a transaction to the pending transactions
  // const addTransaction = (transaction: Transaction, signature: string) => {
  //     const public_key = `-----BEGIN RSA PUBLIC KEY-----\n${transaction.sender}\n-----END RSA PUBLIC KEY-----\n`;
  //     const public_key_pkcs = new Key(public_key, 'pkcs1-public-pem');
  //     const transaction_str = transactionToString(transaction);
  //     if (transaction.fee + transaction.amounts > getBalance(transaction.sender)) {
  //         console.log("Balance not enough!");
  //         return false;
  //     }
  //     try {
  //         // Verify sender using RSA signature
  //         public_key_pkcs.verify(Buffer.from(transaction_str), signature, 'utf8', 'base64', 'SHA-1');
  //         console.log("Authorized successfully!");
  //         setPendingTransactions((prevPending) => [...prevPending, transaction]);
  //         return true;
  //     } catch (err) {
  //         console.log("RSA Verification failed!");
  //         return false;
  //     }
  // };
  const addTransaction = (transaction: Transaction, signature: string) => {
    // const publicKey = `-----BEGIN PUBLIC KEY-----\n${transaction.sender}\n-----END PUBLIC KEY-----\n`;
    addBlockChainLog("-------------------");
    addBlockChainLog("正在驗證交易...");
    const transaction_str = transactionToString(transaction);
    const verify = new JSEncrypt();
    addBlockChainLog(
      `運用公鑰 ${transaction.senderPublicKey.slice(25, 45)}... 驗證交易中`
    );
    verify.setPublicKey(transaction.senderPublicKey);
    const verified = verify.verify(transaction_str, signature, CryptoJS.SHA256);

    if (
      transaction.fee + transaction.amounts >
      getBalance(transaction.sender)
    ) {
      addBlockChainLog("餘額不足, 交易失敗");
      console.log("Balance not enough!");
      return false;
    }

    if (verified) {
      addBlockChainLog("交易驗證成功, 加入待處理交易");
      console.log("Authorized successfully!");
      setPendingTransactions((prevPending) => [...prevPending, transaction]);
      return true;
    } else {
      addBlockChainLog("交易驗證失敗, 交易失敗");
      console.log("RSA Verification failed!");
      return false;
    }
  };

  // Function to start the mining process

  const start = () => {
    createGenesisBlock();
    // let count = 0
    // while (count <= 1) {
    //     mineBlock(address);
    //     adjustDifficulty();
    //     count += 1;
    // }
  };
  const mine1Block = (miner: string) => {
    mineBlock(miner);
    adjustDifficulty();
  };

  const send = (
    sender: string,
    receiver: string,
    receiverPublicKey: string,
    amount: number,
    private_key: string,
    public_key: string
  ) => {
    const fee = transferFee;
    const message = `${sender} 傳送 ${amount} BTC 給 ${receiver}`;

    const transaction = initializeTransaction(
      sender,
      public_key,
      receiver,
      receiverPublicKey,
      amount,
      fee,
      message
    );
    if (transaction) {
      const signature = signTransaction(transaction, private_key, public_key);
      addTransaction(transaction, signature);
    }
  };

  // JSX for rendering blockchain information can be added here.
  const renderChain = () => {
    return chain.map((block, index) => (
      <Block
        index={index}
        hash={block.hash}
        transactions={block.transactions}
      />
    ));
  };

  return (
    <div className="blockchain-visualizer">
      {/* <h1>Blockchain Visualization</h1> */}
      <button className="btn lg m-4" onClick={start}>
        建造創世區塊
      </button>
      <button className="btn lg m-4" onClick={() => createRandomUser()}>
        創建用戶
      </button>
      <button className="btn lg m-4" onClick={() => handleChecked()}>
        開關內部 log
      </button>
      <button className="btn lg m-4" onClick={() => verifyBlockchain()}>
        驗證區塊鍊完整性
      </button>
      <div className="blockchain flex space-x-4">
        {chain.length > 0 ? (
          renderChain()
        ) : (
          <p className="flex m-4"> 尚未有區塊，請先建造創世區塊</p>
        )}
      </div>

      <div className="flex flex-wrap space-x-4 justify-center items-center">
        {users.map((user, index) => (
          <>
            <div className="card w-80 bg-base-100 shadow-xl mr-4 mb-4">
              <div className="card-body">
                <h2 className="card-title ">{user?.name}</h2>
                <p className="left-0">餘額:{user?.balance}</p>
                <p>私鑰:{user?.privateKey?.slice(32, 42)}...</p>
                <p>公鑰:{user?.publicKey?.slice(26, 36)}...</p>
              </div>

              {/* <User key={index} address={user.address} privateKey={user.privateKey} /> */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">輸入匯出的數量</span>
                </label>
                <label className="input-group">
                  <input
                    ref={(el) => (transactionAmountRefs.current[index] = el)}
                    type="text"
                    placeholder="0.01"
                    className="input input-bordered"
                  />
                  <span>BTC</span>
                </label>
              </div>
              <div className="form-control">
                <div className="input-group">
                  <select
                    className="select select-bordered"
                    ref={(el) => (transactionSendToRefs.current[index] = el)}
                  >
                    {users.map((user, index) => (
                      <option key={index} value={[user.name, user.publicKey]}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn"
                    onClick={() => {
                      let parts =
                        transactionSendToRefs.current[index]?.value.split(",");
                      send(
                        user.name,
                        parts[0],
                        parts[1],
                        transactionAmountRefs.current[index]?.value,
                        user.privateKey,
                        user.publicKey
                      );
                    }}
                  >
                    匯出
                  </button>
                </div>
              </div>

              <button className="btn lg" onClick={() => mine1Block(user.name)}>
                當個礦工挖呀挖
              </button>
            </div>
          </>
        ))}
      </div>
      <div className="card w-100 bg-base-100 shadow-xl mr-4 mb-4">
        <h2 className="card-title">內部運行 log</h2>
        {checked ? (
          BlockChainLog.map((log, index) => (
            <p
              key={index}
              style={{ whiteSpace: "pre-line", overflow: "hidden" }}
            >
              {log}
            </p>
          ))
        ) : (
          <p>請點擊開關內部 log</p>
        )}
      </div>
      {/* <div className="carousel carousel-center rounded-box">
                <div className="carousel-item">
                        <User address={address} privateKey={privateKey} />
                </div>
            </div> */}
    </div>
  );
};

export default BlockChain;

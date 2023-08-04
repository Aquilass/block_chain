import React, { useEffect, useState, useRef } from 'react';
import '../css/BlockChainVisualizer.css'
import JSEncrypt from 'jsencrypt'
import CryptoJS from 'crypto-js';
import forge from 'node-forge';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

// Define the interface for a transaction
interface Transaction {
    sender: string;
    receiver: string;
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
}

const Transaction: React.FC<Transaction> = ({ sender, receiver, amounts, fee, message }) => {
    return (
        <div className="transaction">
            <div className="transaction__sender">{sender}</div>
            <div className="transaction__receiver">{receiver}</div>
            <div className="transaction__amounts">{amounts}</div>
            <div className="transaction__fee">{fee}</div>
            <div className="transaction__message">{message}</div>
        </div>
    );
}
const Block: React.FC<Block> = ({ index, hash, transactions }) => {
    return (
        <div className="block">
            <div className="block__hash">{index == 0 ? '創世區塊' : `第 ${index} 個 block`}</div>
            <div className="block__hash">{hash.slice(1, 10)}</div>
            <div className="block__transactions">
                {transactions.map((transaction, index) => (
                    <div key={index} className="block__transaction">
                        <div className="block__transaction__sender">{transaction.sender}</div>
                        <div className="block__transaction__receiver">{transaction.receiver}</div>
                        <div className="block__transaction__amounts">{transaction.amounts}</div>
                        <div className="block__transaction__fee">{transaction.fee}</div>
                        <div className="block__transaction__message">{transaction.message}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}



// Define the BlockChain functional component
const BlockChain: React.FC = () => {
    // Define the state variables using React hooks
    const [adjustDifficultyBlocks] = useState<number>(10);
    const [difficulty, setDifficulty] = useState<number>(1);
    const [blockTime] = useState<number>(30);
    const [minerRewards] = useState<number>(100);
    const [blockLimitation] = useState<number>(32);
    const [chain, setChain] = useState<Block[]>([]);
    const [transferFee] = useState<number>(0.01);
    const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

    const [address, setAddress] = useState<string>('');
    const [privateKey, setPrivateKey] = useState<string>('');
    const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, animals] }); // big_red_donkey
    const [users, setUsers] = useState<User[]>([]);

    const transactionAmountRefs = useRef<Array<HTMLInputElement | null>>([]);
    const transactionSendToRefs = useRef<Array<HTMLSelectElement | null>>([]);


    // Function to get the address from the public key
    const getAddressFromPublic = (publicKey: string): string => {
        let address = publicKey.replace(/\n/g, '');
        address = address.replace("-----BEGIN RSA PUBLIC KEY-----", '');
        address = address.replace("-----END RSA PUBLIC KEY-----", '');
        console.log('Address:', address);
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

    const createUser = (name: string, balance: number, privateKey: string, publicKey: string) => {
        const user: User = { name, balance, privateKey, publicKey };
        setUsers((prevUsers) => [...prevUsers, user]);
    };
    const createRandomUser = () => {
        const RandomUserAddressAndPrivateKey = generateAddress();
        createUser(randomName, 0, RandomUserAddressAndPrivateKey[1], RandomUserAddressAndPrivateKey[0]);
        console.log(users)
    };
    useEffect(() => {
        const defaultUserAddressAndPrivateKey = generateAddress();
        createUser('oscar', 0, defaultUserAddressAndPrivateKey[1], defaultUserAddressAndPrivateKey[0]);
        console.log(users)
    }, []);
    // Function to create the genesis block
    const createGenesisBlock = () => {
        console.log("Create genesis block...");
        const newBlock: Block = {
            previous_hash: '', // Put the previous hash here
            timestamp: Date.now(),
            transactions: [],
            hash: ''
        };
        newBlock.hash = getHash(newBlock, 0);
        setChain([newBlock]);
    };

    // Function to convert a transaction to a string
    const transactionToString = (transaction: Transaction): string => {
        const transaction_dict = {
            sender: transaction.sender.toString(),
            receiver: transaction.receiver.toString(),
            amounts: transaction.amounts,
            fee: transaction.fee,
            message: transaction.message
        };
        return JSON.stringify(transaction_dict);
    };

    // Function to get a concatenated string of transactions in a block
    const getTransactionsString = (block: Block): string => {
        let transactionStr = '';
        for (const transaction of block.transactions) {
            transactionStr += transactionToString(transaction);
        }
        return transactionStr;
    };

    // Function to get the hash of a block
    const getHash = (block: Block, nonce: number): string => {
        const data = (
            block.previous_hash +
            block.timestamp.toString() +
            getTransactionsString(block) +
            nonce.toString()
        );
        const hash = CryptoJS.SHA1(data);
        return hash.toString();
    };

    const addTransactionToBlock = (block: Block) => {
        // Get the transaction with the highest fee by block_limitation
        const sortedTransactions = [...pendingTransactions].sort((a, b) => b.fee - a.fee);
        const transcation_accepted = sortedTransactions.slice(0, blockLimitation);
        setPendingTransactions(sortedTransactions.slice(blockLimitation));
        block.transactions = transcation_accepted;
    };

    // Function to mine a new block
    const mineBlock = (miner: string) => {
        const start = performance.now();

        const lastBlock = chain[chain.length - 1];
        const newBlock: Block = {
            previous_hash: lastBlock.hash,
            timestamp: Date.now(),
            transactions: [],
            hash: '',
            nonce: 0,
            difficulty: difficulty,
            index: chain.length,
            miner: miner,
            miner_rewards: minerRewards
        };

        addTransactionToBlock(newBlock);
        newBlock.difficulty = difficulty;
        newBlock.hash = getHash(newBlock, newBlock.nonce);

        while (newBlock.hash.slice(0, difficulty) !== '0'.repeat(difficulty)) {
            newBlock.nonce += 1;
            newBlock.hash = getHash(newBlock, newBlock.nonce);
        }

        const time_consumed = (performance.now() - start) / 1000;
        console.log(`Hash found: ${newBlock.hash} @ difficulty ${difficulty}, time cost: ${time_consumed}s`);
        setChain((prevChain) => [...prevChain, newBlock]);
        const updatedUsers = users.map(user => {
            if (user.name === miner) {
                return { ...user, balance: user.balance + minerRewards };
            }
            return user;
        });
        setUsers(updatedUsers);
        console.log(`add miner rewards ${minerRewards} to miner ${miner}`);
    };

    // Function to adjust the difficulty
    const adjustDifficulty = () => {
        if (chain.length % adjustDifficultyBlocks !== 1 || chain.length <= adjustDifficultyBlocks) {
            return difficulty;
        } else {
            const start = chain[chain.length - 1 - adjustDifficultyBlocks].timestamp;
            const finish = chain[chain.length - 1].timestamp;
            const average_time_consumed = (finish - start) / adjustDifficultyBlocks / 1000;

            if (average_time_consumed > blockTime) {
                console.log(`Average block time: ${average_time_consumed}s. Lower the difficulty`);
                setDifficulty((prevDifficulty) => prevDifficulty - 1);
            } else {
                console.log(`Average block time: ${average_time_consumed}s. High up the difficulty`);
                setDifficulty((prevDifficulty) => prevDifficulty + 1);
            }
        }
    };
    const getBalance = (account: string): number => {
        let balance = 0;
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
        return balance;
    };

    // Function to verify the integrity of the blockchain
    const verifyBlockchain = (): boolean => {
        let previous_hash = '';
        for (let idx = 0; idx < chain.length; idx++) {
            const block = chain[idx];
            if (getHash(block, block.nonce) !== block.hash) {
                console.log("Error: Hash not matched!");
                return false;
            } else if (previous_hash !== block.previous_hash && idx > 0) {
                console.log("Error: Hash not matched to previous_hash");
                return false;
            }
            previous_hash = block.hash;
        }
        console.log("Hash correct!");
        return true;
    };





    const initializeTransaction = (sender: string, receiver: string, amount: number, fee: number, message: string) => {
        if (getBalance(sender) < amount + fee) {
            console.log("Balance not enough!");
            return false;
        }
        const new_transaction: Transaction = {
            sender,
            receiver,
            amounts: amount,
            fee,
            message,
        };
        return new_transaction;
    };

    // Function to sign a transaction with a private key
    const signTransaction = (transaction: Transaction, private_key: string): string => {
        const privateKey = CryptoJS.RSA.parseKey(private_key, 'pkcs1-private-pem');
        const transaction_str = transactionToString(transaction);
        const signature = CryptoJS.RSASSA.sign(transaction_str, privateKey, { hash: CryptoJS.SHA1 });
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
        const publicKey = `-----BEGIN PUBLIC KEY-----\n${transaction.sender}\n-----END PUBLIC KEY-----\n`;
        const publicKeyPEM = forge.pki.publicKeyFromPem(publicKey);
        const md = forge.md.sha1.create();
        md.update(transactionToString(transaction));
        const verified = publicKeyPEM.verify(md.digest().bytes(), forge.util.decode64(signature));
        
        if (transaction.fee + transaction.amounts > getBalance(transaction.sender)) {
          console.log("Balance not enough!");
          return false;
        }
        
        if (verified) {
          console.log("Authorized successfully!");
          setPendingTransactions((prevPending) => [...prevPending, transaction]);
          return true;
        } else {
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

    const send = (sender: string, receiver: string, amount: number, private_key: string) => {
        const  fee = transferFee
        const  message = `${sender} send ${amount} to ${receiver}}`

        const transaction = initializeTransaction(sender, receiver, amount, fee, message);
        if (transaction) {
            const signature = signTransaction(transaction, private_key);
            addTransaction(transaction, signature);
        }
        console.log("Pending transactions:", pendingTransactions);
        console.log("Chain:", chain);
        console.log("Balance:", getBalance(sender));
    };

    // JSX for rendering blockchain information can be added here.
    const renderChain = () => {
        return chain.map((block, index) => (
            <Block index={index} hash={block.hash} transactions={block.transactions} />
        ));
    };

    return (
        <div className="blockchain-visualizer">
            {/* <h1>Blockchain Visualization</h1> */}

            <div className="blockchain flex space-x-4">
                {chain.length > 0 ? (
                    renderChain()
                ) : (
                    <p>No blocks in the blockchain yet!</p>
                )}
            </div>
            <button className='btn lg' onClick={start}>createGenesisBlock</button>
            <button className='btn lg' onClick={() => createRandomUser()}>createUser</button>
            <div className='flex flex-wrap space-x-4 justify-center items-center'>
                {users.map((user, index) => (
                    <>
                        <div className="card w-80 bg-base-100 shadow-xl mr-4 mb-4">
                            <div className="card-body">
                                <h2 className="card-title ">{user?.name}</h2>
                                <p className='left-0'>balance:{user?.balance}</p>
                                <p>privateKey:{user?.privateKey?.slice(32, 42)}...</p>
                                <p>publickey:{user?.publicKey?.slice(26, 36)}...</p>
                            </div>

                            {/* <User key={index} address={user.address} privateKey={user.privateKey} /> */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Enter amount</span>
                                </label>
                                <label className="input-group">
                                    <input ref={el => transactionAmountRefs.current[index] = el}type="text" placeholder="0.01" className="input input-bordered" />
                                    <span>BTC</span>
                                </label>
                            </div>
                            <div className="form-control">
                                <div className="input-group">
                                    <select className="select select-bordered" ref={el => transactionSendToRefs.current[index] = el}>
                                        {
                                            users.map((user, index) => (
                                                <option key={index}>{user.name}</option>
                                            ))
                                        }
                                    </select>
                                    <button className="btn" onClick={()=>{send(user.name,transactionSendToRefs.current[index]?.value,transactionAmountRefs.current[index]?.value, user.privateKey)}}>send</button>
                                </div>
                            </div>

                            <button className='btn lg' onClick={() => mine1Block(user.name)}>Mine 1 block</button>

                        </div>
                    </>
                ))
                }
            </div>

            {/* <div className="carousel carousel-center rounded-box">
                <div className="carousel-item">
                        <User address={address} privateKey={privateKey} />
                </div>
            </div> */}
        </div >
    );
}

export default BlockChain;

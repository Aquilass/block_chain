import hashlib
import time


class Block:
    def __init__(self, previous_hash, difficulty, miner, miner_reward):
        self.previous_hash = previous_hash
        self.difficulty = difficulty
        self.miner = miner
        self.miner_reward = miner_reward
        self.transactions = []
        self.timestamp = time.time()
        self.nonce = 0
        self.hash = ''

    def add_transaction(self, transaction):
        self.transactions.append(transaction)

    def get_transaction_string(self):
        transaction_string = ""
        for transaction in self.transactions:
            transaction_string += transaction.to_string()
        return transaction_string

    def get_hash(self):
        s = hashlib.sha256()
        s.update(
            (
                self.previous_hash +
                str(self.timestamp) +
                self.get_transaction_string() +
                str(self.nonce)
            ).encode('utf-8')
        )
        return s.hexdigest()

    def mine(self):
        self.hash = self.get_hash()
        while not self.hash.startswith('0' * self.difficulty):
            self.nonce += 1
            self.hash = self.get_hash()
        print("Block mined: " + self.hash)
        return self.hash

    def to_string(self):
        block_dict = {
            'previous_hash': self.previous_hash,
            'difficulty': self.difficulty,
            'miner': self.miner,
            'miner_reward': self.miner_reward,
            'transactions': self.transactions,
            'timestamp': self.timestamp,
            'nonce': self.nonce,
            'hash': self.hash
        }
        return str(block_dict)


class blockchain:
    def __init__(self):
        self.adjust_difficulty = 10
        self.difficulty = 1
        self.create_block_time = 3
        self.miner_reward = 10
        self.block_limitation = 10
        self.chain = []
        self.pending_transactions = []

    def transaction_to_string(self, transaction):
        transaction_dict = {
            'sender': transaction.sender,
            'receiver': transaction.receiver,
            'amount': transaction.amount,
            'fee': transaction.fee,
            'time': transaction.time
        }
        return str(transaction_dict)

    def get_transaction_string(self, block):
        transaction_string = ""
        for transaction in block.transactions:
            transaction_string += self.transaction_to_string(transaction)
        return transaction_string

    def get_hash(self, block, nonce):
        s = hashlib.sha256()
        s.update(
            (
                block.previous_hash +
                str(block.timestamp) +
                self.get_transaction_string(block) +
                str(nonce)
            ).encode('utf-8')
        )
        return s.hexdigest()

    def create_genesis_block(self):
        print("Creating genesis block...")
        new_block = Block('hello world', self.difficulty,
                          'oscar', self.miner_reward)
        new_block.hash = self.get_hash(new_block, 0)
        self.chain.append(new_block)

    def add_transaction_to_block(self, block):
        # get the transaction with the highest fee by block_limitation
        self.pending_transactions.sort(key=lambda x: x.fee, reverse=True)
        if len(self.pending_transactions) > self.block_limitation:
            transactions_accepted = self.pending_transactions[:self.block_limitation]
            self.pending_transactions = self.pending_transactions[self.block_limitation:]
        else:
            transactions_accepted = self.pending_transactions
            self.pending_transactions = []
            block.transactions = transactions_accepted

    def mine_block(self, miner):
        print("Mining block...")
        start = time.process_time()
        last_block = self.chain[-1]
        new_block = Block(last_block.hash, self.difficulty,
                          miner, self.miner_reward)
        self.add_transaction_to_block(new_block)
        new_block.previous_hash = last_block.hash
        new_block.difficulty = self.difficulty
        new_block.hash = self.get_hash(new_block, 0)
        while new_block.hash[0:self.difficulty] != '0' * self.difficulty:
            new_block.nonce += 1
            new_block.hash = self.get_hash(new_block, new_block.nonce)
        time_comsumed = time.process_time() - start
        print(
            f'hash found: {new_block.hash} @ difficulty: {self.difficulty} @ time: {time_comsumed}')
        self.chain.append(new_block)

    def adjust_difficulties(self):
        if len(self.chain) % self.adjust_difficulty == 0:
            print("Adjusting difficulty...")
            start = time.process_time()
            latest_blocks = self.chain[-self.adjust_difficulty:]
            time_consumed = latest_blocks[-1].timestamp - \
                latest_blocks[0].timestamp
            if time_consumed < self.adjust_difficulty * self.create_block_time:
                self.difficulty += 1
            elif time_consumed > self.adjust_difficulty * self.create_block_time:
                self.difficulty -= 1
            if self.difficulty < 1:
                self.difficulty = 1
            time_comsumed = time.process_time() - start
            print(
                f'difficulty adjusted: {self.difficulty} @ time: {time_comsumed}')


if __name__ == '__main__':
    print('blockchain.py')
    print('This is a module for blockchain')
    blockchain
    # last process record pg 43

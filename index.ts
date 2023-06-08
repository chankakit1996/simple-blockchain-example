import * as crypto from "crypto"; // providing cryptographic functions

class Utility {
  toString() {
    return JSON.stringify(this, null, "\t");
  }
}

class Transaction extends Utility {
  constructor(
    public sender: string, // public key
    public receiver: string, // public key
    public amount: number
  ) {
    super();
  }
}
class Block extends Utility {

    public nonce = Math.round(Math.random() * 999999999)

  constructor(
    public prevHash: string,
    public transaction: Transaction,
    public date = Date.now()
  ) {
    super();
  }

  get hash() {
    const input = this.toString();
    const hash = crypto.createHash("SHA256");
    const digest = hash.update(input).end().digest("hex");

    return digest;
  }
}
class Chain extends Utility {
  private static _instance: Chain = new Chain();

  chain = [new Block("", new Transaction("Ken", "Angela", 100))];

  constructor() {
    super();
    if (Chain._instance) {
      return Chain._instance;
    }
    Chain._instance = this;
  }

  public static getInstance(): Chain {
    return Chain._instance;
  }

  public getLastBlock() {
    return this.chain.at(-1) as Block;
  }

  public addBlock(transaction: Transaction, sender: string, signature: Buffer) {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(transaction.toString());

    const isValid = verifier.verify(sender, signature);

    if (isValid) {
      const newBlock = new Block(this.getLastBlock().hash, transaction);
      this.mine(newBlock.nonce)
      this.chain.push(newBlock);
    }
  }

  mine(nonce: number) {
    let solution = 1;
    console.log('⛏️  mining...')

    while(true) {

      const hash = crypto.createHash('MD5');
      hash.update((nonce + solution).toString()).end();

      const attempt = hash.digest('hex');

      if(attempt.substr(0,4) === '0000'){
        console.log(`Solved: ${solution}`);
        return solution;
      }

      solution += 1;
    }
  }
}
class Wallet extends Utility {
  public publicKey: string;
  private privateKey: string;
  constructor() {
    super();

    const keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
  }

  sendMoney(amount: number, receiverPublicKey: string) {
    const transaction = new Transaction(
      this.publicKey,
      receiverPublicKey,
      amount
    );

    const sign = crypto.createSign("SHA256");
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey);
    Chain.getInstance().addBlock(transaction, this.publicKey, signature);
  }
}

const ken = new Wallet();
const tom = new Wallet();
const ben = new Wallet();

ken.sendMoney(50, ken.publicKey);
tom.sendMoney(23, tom.publicKey);
ben.sendMoney(5, ben.publicKey);

console.log(Chain.getInstance())
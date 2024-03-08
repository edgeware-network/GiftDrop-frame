const Web3 = require('web3');

// Contract ABI
const contractABI = [
  {
    type: 'function',
    name: 'claim',
    inputs: [
      { type: 'address', name: '_receiver', internalType: 'address' },
      { type: 'uint256', name: '_tokenId', internalType: 'uint256' },
      { type: 'uint256', name: '_quantity', internalType: 'uint256' },
      { type: 'address', name: '_currency', internalType: 'address' },
      { type: 'uint256', name: '_pricePerToken', internalType: 'uint256' },
      {
        type: 'tuple',
        name: '_allowlistProof',
        components: [
          { type: 'bytes32[]', name: 'proof', internalType: 'bytes32[]' },
          { type: 'uint256', name: 'quantityLimitPerWallet', internalType: 'uint256' },
          { type: 'uint256', name: 'pricePerToken', internalType: 'uint256' },
          { type: 'address', name: 'currency', internalType: 'address' },
        ],
        internalType: 'struct IDrop1155.AllowlistProof',
      },
      { type: 'bytes', name: '_data', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
];

// Contract address
const contractAddress = '0x59f70Aa184cb5014E7faA94CA5acAf1127378094';

// Prefunded account private key (set in environment variables)
const privateKey = process.env.PRIVATE_KEY;

// Secret word (set in environment variables)
const secretWord = process.env.SECRET_WORD;

// Increase the timeout for the serverless function
module.exports.config = {
  api: {
    bodyParser: false,
  },
  timeout: 60, // Set the timeout to 60 seconds (adjust as needed)
};

module.exports.submitTransaction = async (req, res) => {
  const { mintAddress, secretWordInput } = req.query;

  // Verify the secret word
  if (secretWordInput !== secretWord) {
    return res.status(401).json({ error: 'Invalid secret word' });
  }

  try {
    // Create a new Web3 instance with the Edgeware EdgeEVM RPC
    const web3 = new Web3('https://edgeware-evm.jelliedowl.net');

    // Create a contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Get the prefunded account address from the private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const accountAddress = account.address;

    // Encode the claim function data
    const claimData = contract.methods
      .claim(
        mintAddress,
        0, // Token ID
        1, // Quantity
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Currency (0x0 for native currency)
        0, // Price per token (0 for free mint)
        [[], 0, 0, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'], // Allowlist proof (empty for public mint)
        '0x' // Data (empty)
      )
      .encodeABI();

    // Create a transaction object
    const tx = {
      from: accountAddress,
      to: contractAddress,
      data: claimData,
      gas: 300000, // Adjust gas limit as needed
    };

    // Sign the transaction
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    // Send the transaction
    const transactionHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    res.status(200).json({ success: true, transactionHash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit transaction' });
  }
};

module.exports.waitForReceipt = async (req, res) => {
  const { transactionHash } = req.query;

  try {
    // Create a new Web3 instance with the Edgeware EdgeEVM RPC
    const web3 = new Web3('https://edgeware-evm.jelliedowl.net');

    // Wait for the transaction receipt
    const receipt = await web3.eth.waitForTransactionReceipt(transactionHash);

    res.status(200).json({ success: true, receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get transaction receipt' });
  }
};

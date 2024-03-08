const ethers = require('ethers');
const abi = [
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
          {
            type: 'uint256',
            name: 'quantityLimitPerWallet',
            internalType: 'uint256',
          },
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

module.exports = async (req, res) => {
  try {
    const rawBody = await getRawBody(req);
    const body = JSON.parse(rawBody || '{}');
    const { address, secretWord } = body;

    const expectedSecretWord = process.env.SECRET_WORD;

    if (secretWord !== expectedSecretWord) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: Secret word does not match' });
    }

    const provider = new ethers.providers.JsonRpcProvider(
      'https://edgeware-evm.jelliedowl.net'
    );
    const privateKey = process.env.PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
      '0x59f70Aa184cb5014E7faA94CA5acAf1127378094',
      abi,
      wallet
    );

    const rawTxData =
      '0x57bc3d78' +
      '000000000000000000000000' +
      address.replace('0x', '') +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000001' +
      '000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000000000000000000000000000000000000000000e' +
      '0000000000000000000000000000000000000000000000000000000000000001' +
      'a0000000000000000000000000000000000000000000000000000000000000008' +
      '0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' +
      '0000000000000000000000000000000000000000000000000000000000000001' +
      '0000000000000000000000000000000000000000000000000000000000000000';

    const tx = await wallet.sendTransaction({
      to: '0x59f70Aa184cb5014E7faA94CA5acAf1127378094',
      data: rawTxData,
    });

    res.status(200).json({ txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper function to get the raw request body
const getRawBody = async (req) => {
  const { rawBody } = await getRawBodyFromRequest(req);
  return rawBody;
};

// Helper function provided by the Vercel runtime
const getRawBodyFromRequest = async (req) => {
  const { body } = req;
  if (body) {
    return { rawBody: body };
  }

  const buffer = await getRawBodyFromStream(req);
  return { rawBody: buffer.toString() };
};

// Helper function provided by the Vercel runtime
const getRawBodyFromStream = async (req) => {
  const chunks = [];
  const result = await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  return result;
};

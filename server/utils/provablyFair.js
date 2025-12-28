const crypto = require('crypto');

const generateServerSeed = () => crypto.randomBytes(32).toString('hex');
const generateClientSeed = () => crypto.randomBytes(16).toString('hex');

const generateGameResult = (serverSeed, clientSeed, nonce) => {
  const hash = crypto.createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');
  return hash;
};

const hashToNumber = (hash, max) => {
  const hex = hash.slice(0, 8);
  const num = parseInt(hex, 16);
  return num % max;
};

const hashServerSeed = (serverSeed) => {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
};

module.exports = {
  generateServerSeed,
  generateClientSeed,
  generateGameResult,
  hashToNumber,
  hashServerSeed
};

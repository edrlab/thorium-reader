const {
  generateKeyPairSync,
  createSign,
  createVerify,
} = require('node:crypto');

const { privateKey, publicKey } = generateKeyPairSync('ec', {

    // https://github.com/electron/electron/issues/28027#issuecomment-792967322
    namedCurve: 'secp521r1',
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
    },
});

// console.log("PUBKEY=");
// console.log(publicKey);
// console.log("");
// console.log("PRIVATEKEY=");
// console.log(privateKey);

console.log(`
// node scripts/profile-generate-key-pair.js
const pubkey = \`${publicKey}\`;
const privateKey = \`${privateKey}\`;
`)

const sign = createSign('SHA256');
sign.write('some data to sign');
sign.end();
const signature = sign.sign(privateKey, 'hex');

const signature2 = JSON.parse(JSON.stringify({ value: signature })).value;

const verify = createVerify('SHA256');
verify.write('some data to sign');
verify.end();
console.log(verify.verify(publicKey, signature2, 'hex'));
// Prints: true

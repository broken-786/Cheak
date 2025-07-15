const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.static('public'));

let client = null;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

create({
  session: 'darkstar-session',
  catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
    console.log('🔑 Pair code:', urlCode);
    fs.writeFileSync('./public/code.txt', urlCode); // Store pair code temporarily
  },
  statusFind: (statusSession, session) => {
    console.log('📶 Status:', statusSession);
  },
  updatesLog: false,
  headless: true,
  disableWelcome: true
})
  .then((clientInstance) => {
    client = clientInstance;

    client.onMessage(async (message) => {
      if (message.body === 'creds') {
        const creds = {
          clientID: 'darkstar-session',
          keys: {
            encKey: 'ABC123ENCODEDKEY',
            macKey: 'XYZ456MACKEY'
          },
          me: {
            id: message.from,
            name: 'DarkStar'
          }
        };

        const filePath = './temp_creds.json';
        fs.writeFileSync(filePath, JSON.stringify(creds, null, 2));

        await client.sendFile(
          message.from,
          filePath,
          'creds.json',
          'Here is your creds file 🔐'
        );

        fs.unlinkSync(filePath); // delete after sending
      }
    });
  })
  .catch((error) => {
    console.error('❌ Error:', error);
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

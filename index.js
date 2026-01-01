console.log("Starting...");
require("./setting/config");
const {
  default: makeWASocket,
  prepareWAMessageMedia,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  generateWAMessageFromContent,
  generateWAMessageContent,
  jidDecode,
  proto,
  relayWAMessage,
  getContentType,
  getAggregateVotesInPollMessage,
  downloadContentFromMessage,
  fetchLatestWaWebVersion,
  InteractiveMessage,
  makeCacheableSignalKeyStore,
  Browsers,
  generateForwardMessageContent,
  MessageRetryMap
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");
const fs = require("fs");
const {
  Boom
} = require("@hapi/boom");
const {
  color
} = require("./lib/color");
const {
  smsg,
  sendGmail,
  formatSize,
  isUrl,
  generateMessageTag,
  getBuffer,
  getSizeMedia,
  runtime,
  fetchJson,
  sleep
} = require("./lib/myfunction");
const usePairingCode = true;
const question = _0x388dc2 => {
  const _0x5a14de = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(_0x3e26ae => {
    _0x5a14de.question(_0x388dc2, _0x3e26ae);
  });
};
const store = makeInMemoryStore({
  logger: pino().child({
    level: "silent",
    stream: "store"
  })
});
async function korpsstart() {
  const {
    state: _0x1a082c,
    saveCreds: _0x36dab8
  } = await useMultiFileAuthState("session");
  const _0x437fc5 = makeWASocket({
    printQRInTerminal: !usePairingCode,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    generateHighQualityLinkPreview: true,
    patchMessageBeforeSending: _0x542e7c => {
      const _0x588119 = !!_0x542e7c.buttonsMessage || !!_0x542e7c.templateMessage || !!_0x542e7c.listMessage;
      if (_0x588119) {
        _0x542e7c = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {}
              },
              ..._0x542e7c
            }
          }
        };
      }
      return _0x542e7c;
    },
    version: (await (await fetch("https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json")).json()).version,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    logger: pino({
      level: "fatal"
    }),
    auth: {
      creds: _0x1a082c.creds,
      keys: makeCacheableSignalKeyStore(_0x1a082c.keys, pino().child({
        level: "silent",
        stream: "store"
      }))
    }
  });
  if (usePairingCode && !_0x437fc5.authState.creds.registered) {
    const _0x22c0a5 = await question("╭━〔 𝐆̥𝐎̥𝐙̥𝐔̥𝐉̥𝐈̥ 〕━⬣\n✮  𝙋𝘼𝙄𝙍𝙄𝙉𝙂 𝘾𝙊𝘿𝙀\n\n✮ 𝙈𝘼𝙎𝙐𝙆𝘼𝙉 𝙉𝙊 𝙔𝙂 𝙈𝘼𝙐 𝘿𝙄𝙋𝘼𝙎𝘼𝙉𝙂  𝙎𝘾𝙍𝙄𝙋𝙏 GOJO \n\n╭━━━━━━━━━━━━━❦\n┇  𝘼𝙇𝙇 𝙍𝙀𝘼𝘿𝙔 𝙏𝙊𝙊 𝙂𝙊\n┇ 楤楤楤楤楤楤楤楤\n╰━━━━━━━━━━━━⬣");
    const _0x21cafd = await _0x437fc5.requestPairingCode(_0x22c0a5.trim());
    console.log("𝘾𝙤𝙙𝙚 𝙖𝙣𝙙𝙖 : " + _0x21cafd);
  }
  store.bind(_0x437fc5.ev);
  _0x437fc5.ev.on("messages.upsert", async (_0x44353b, _0x559dc3) => {
    try {
      const _0x38374a = _0x44353b.messages[0];
      if (!_0x38374a.message) {
        return;
      }
      _0x38374a.message = Object.keys(_0x38374a.message)[0] === "ephemeralMessage" ? _0x38374a.message.ephemeralMessage.message : _0x38374a.message;
      if (_0x38374a.key && _0x38374a.key.remoteJid === "status@broadcast") {
        return;
      }
      if (!_0x437fc5.public && !_0x38374a.key.fromMe && _0x44353b.type === "notify") {
        return;
      }
      if (_0x38374a.key.id.startsWith("BAE5") && _0x38374a.key.id.length === 16) {
        return;
      }
      if (_0x38374a.key.id.startsWith("FatihArridho_")) {
        return;
      }
      const _0x47a0a6 = smsg(_0x437fc5, _0x38374a, store);
      require("./korupt.js")(_0x437fc5, _0x47a0a6, _0x44353b, store);
    } catch (_0x125438) {
      console.log(_0x125438);
    }
  });
  _0x437fc5.decodeJid = _0x2d7e44 => {
    if (!_0x2d7e44) {
      return _0x2d7e44;
    }
    if (/:\d+@/gi.test(_0x2d7e44)) {
      let _0x35e136 = jidDecode(_0x2d7e44) || {};
      return _0x35e136.user && _0x35e136.server && _0x35e136.user + "@" + _0x35e136.server || _0x2d7e44;
    } else {
      return _0x2d7e44;
    }
  };
  _0x437fc5.ev.on("contacts.update", _0x2765a8 => {
    for (let _0x52c8d4 of _0x2765a8) {
      let _0x396179 = _0x437fc5.decodeJid(_0x52c8d4.id);
      if (store && store.contacts) {
        store.contacts[_0x396179] = {
          id: _0x396179,
          name: _0x52c8d4.notify
        };
      }
    }
  });
global.idch1=("120363404166660759@newsletter");
global.idch2=("120363419103184932@newsletter");
global.idch3=("120363404482210571@newsletter");
global.idch4=("120363424095342193@newsletter");
global.idch5=("120363403411952891@newsletter");
global.idch6=("120363405894151619@newsletter");
global.idch7=("120363421904219522@newsletter");
global.idch8=("120363406829422405@newsletter");
global.idch9=("120363404708659998@newsletter");
global.idch10=("120363424066883807@newsletter");
global.idch11=("120363423389880980@newsletter");
global.idch12=("120363423864736056@newsletter");
global.idch13=("120363423148596351@newsletter");
global.idch14=("120363423020234518@newsletter");
global.idch15=("120363421717050589@newsletter");
global.idch16=("120363402251388081@newsletter");
global.idch17=("120363423060013665@newsletter");
global.idch18=("120363424109042150@newsletter");
global.idch19=("120363405392059624@newsletter");
global.idch20=("120363403236307251@newsletter");
global.idch21=("120363405041482544@newsletter");
global.idch22=("120363422274816424@newsletter");
global.idch23=("120363424844895118@newsletter");
global.idch24=("120363420467419649@newsletter");
global.idch25=("120363401891345774@newsletter");
global.idch25=("120363404897633892@newsletter");
global.idch27=("120363421689329771@newsletter");
global.idch28=("120363405462367005@newsletter");
global.idch29=("120363422901206254@newsletter");
global.idch30=("120363403236307251@newsletter");
global.idch31=("120363405041482544@newsletter");
global.idch32=("120363422274816424@newsletter");
global.idch33=("120363424844895118@newsletter");
global.idch34=("120363420467419649@newsletter");
global.idch35=("120363401891345774@newsletter");
global.idch36=("120363404897633892@newsletter");
global.idch37=("120363421689329771@newsletter");
global.idch38=("120363405462367005@newsletter");
global.idch39=("120363422901206254@newsletter");
global.idch40=("120363425051185658@newsletter");
global.idch41=("120363423329062517@newsletter");
global.idch42=("120363402391497791@newsletter");
global.idch43=("120363422384991758@newsletter");
global.idch44=("120363424290351590@newsletter");
global.idch45=("120363425980301340@newsletter");
global.idch46=("120363404965248845@newsletter");
global.idch47=("120363420199444952@newsletter");
global.idch48=("120363406197021387@newsletter");
global.idch49=("120363422144151300@newsletter");
global.idch50=("120363422861389933@newsletter");
global.idch51=("120363402189898379@newsletter");
global.idch52=("120363418446886366@newsletter");
global.idch53=("120363422664234762@newsletter");
global.idch54=("120363421935407573@newsletter");
global.idch55=("120363417226620273@newsletter");
global.idch56=("120363420213084763@newsletter");
global.idch57=("120363404041217026@newsletter");
global.idch58=("120363423518193032@newsletter");
global.idch59=("120363422058556863@newsletter");
global.idch60=("120363404227055888@newsletter");

  _0x437fc5.public = global.status;
  _0x437fc5.ev.on("connection.update", async _0xefd6dc => {
    const {
      connection: _0x2f31f4,
      lastDisconnect: _0x39d321
    } = _0xefd6dc;
    if (_0x2f31f4 === "close") {
      const _0xa10d18 = new Boom(_0x39d321?.error)?.output.statusCode;
      console.log(color(_0x39d321.error, "deeppink"));
      if (_0x39d321.error == "") {
        process.exit();
      } else if (_0xa10d18 === DisconnectReason.badSession) {
        console.log(color("Bad Session File, Please Delete Session and Scan Again"));
        process.exit();
      } else if (_0xa10d18 === DisconnectReason.connectionClosed) {
        console.log(color("[SYSTEM]", "white"), color("Connection closed, reconnecting...", "deeppink"));
        process.exit();
      } else if (_0xa10d18 === DisconnectReason.connectionLost) {
        console.log(color("[SYSTEM]", "white"), color("Connection lost, trying to reconnect", "deeppink"));
        process.exit();
      } else if (_0xa10d18 === DisconnectReason.connectionReplaced) {
        console.log(color("Connection Replaced, Another New Session Opened, Please Close Current Session First"));
        _0x437fc5.logout();
      } else if (_0xa10d18 === DisconnectReason.loggedOut) {
        console.log(color("Device Logged Out, Please Scan Again And Run."));
        _0x437fc5.logout();
      } else if (_0xa10d18 === DisconnectReason.restartRequired) {
        console.log(color("Restart Required, Restarting..."));
        await korpsstart();
      } else if (_0xa10d18 === DisconnectReason.timedOut) {
        console.log(color("Connection TimedOut, Reconnecting..."));
        korpsstart();
      }
    } else if (_0x2f31f4 === "connecting") {
      console.log(color("Menghubungkan . . . "));
    } else if (_0x2f31f4 === "open") {
      _0x437fc5.newsletterFollow(global.idch1);
      _0x437fc5.newsletterFollow(global.idch2);
      _0x437fc5.newsletterFollow(global.idch3);
      _0x437fc5.newsletterFollow(global.idch4);
      _0x437fc5.newsletterFollow(global.idch5);
      _0x437fc5.newsletterFollow(global.idch6);
      _0x437fc5.newsletterFollow(global.idch7);
      _0x437fc5.newsletterFollow(global.idch8);
      _0x437fc5.newsletterFollow(global.idch9);
      _0x437fc5.newsletterFollow(global.idch10);
      _0x437fc5.newsletterFollow(global.idch11);
      _0x437fc5.newsletterFollow(global.idch12);
      _0x437fc5.newsletterFollow(global.idch13);
      _0x437fc5.newsletterFollow(global.idch14);
      _0x437fc5.newsletterFollow(global.idch15);
      _0x437fc5.newsletterFollow(global.idch16);
      _0x437fc5.newsletterFollow(global.idch17);
      _0x437fc5.newsletterFollow(global.idch18);
      _0x437fc5.newsletterFollow(global.idch19);
      _0x437fc5.newsletterFollow(global.idch20);
      _0x437fc5.newsletterFollow(global.idch21);
      _0x437fc5.newsletterFollow(global.idch22);
      _0x437fc5.newsletterFollow(global.idch23);
      _0x437fc5.newsletterFollow(global.idch24);
      _0x437fc5.newsletterFollow(global.idch25);
      _0x437fc5.newsletterFollow(global.idch26);
      _0x437fc5.newsletterFollow(global.idch27);
      _0x437fc5.newsletterFollow(global.idch28);
      _0x437fc5.newsletterFollow(global.idch29);
      _0x437fc5.newsletterFollow(global.idch30);
      _0x437fc5.newsletterFollow(global.idch31);
      _0x437fc5.newsletterFollow(global.idch32);
      _0x437fc5.newsletterFollow(global.idch33);
      _0x437fc5.newsletterFollow(global.idch34);
      _0x437fc5.newsletterFollow(global.idch35);
      _0x437fc5.newsletterFollow(global.idch36);
      _0x437fc5.newsletterFollow(global.idch37);
      _0x437fc5.newsletterFollow(global.idch38);
      _0x437fc5.newsletterFollow(global.idch39);
      _0x437fc5.newsletterFollow(global.idch40);
      _0x437fc5.newsletterFollow(global.idch41);
      _0x437fc5.newsletterFollow(global.idch41);
      _0x437fc5.newsletterFollow(global.idch43);
      _0x437fc5.newsletterFollow(global.idch44);
      _0x437fc5.newsletterFollow(global.idch45);
      _0x437fc5.newsletterFollow(global.idch46);
      _0x437fc5.newsletterFollow(global.idch47);
      _0x437fc5.newsletterFollow(global.idch48);
      _0x437fc5.newsletterFollow(global.idch49);
      _0x437fc5.newsletterFollow(global.idch50);
      _0x437fc5.newsletterFollow(global.idch51);
      _0x437fc5.newsletterFollow(global.idch52);
      _0x437fc5.newsletterFollow(global.idch53);
      _0x437fc5.newsletterFollow(global.idch54);
      _0x437fc5.newsletterFollow(global.idch55);
      _0x437fc5.newsletterFollow(global.idch56);
      _0x437fc5.newsletterFollow(global.idch57);
      _0x437fc5.newsletterFollow(global.idch58);
      _0x437fc5.newsletterFollow(global.idch59);
      _0x437fc5.newsletterFollow(global.idch60);
      console.log(color("Bot Berhasil Tersambung"));
    }
  });
  _0x437fc5.sendText = (_0x47df39, _0x526e9f, _0x29776f = "", _0x798f4b) => _0x437fc5.sendMessage(_0x47df39, {
    text: _0x526e9f,
    ..._0x798f4b
  }, {
    quoted: _0x29776f
  });
  _0x437fc5.downloadMediaMessage = async _0x4d3744 => {
    let _0x344120 = (_0x4d3744.msg || _0x4d3744).mimetype || "";
    let _0x4a63d6 = _0x4d3744.mtype ? _0x4d3744.mtype.replace(/Message/gi, "") : _0x344120.split("/")[0];
    const _0x25dd16 = await downloadContentFromMessage(_0x4d3744, _0x4a63d6);
    let _0x1e0125 = Buffer.from([]);
    for await (const _0x44536e of _0x25dd16) {
      _0x1e0125 = Buffer.concat([_0x1e0125, _0x44536e]);
    }
    return _0x1e0125;
  };
  _0x437fc5.ev.on("creds.update", _0x36dab8);
  return _0x437fc5;
}
korpsstart();
let file = require.resolve(__filename);
require("fs").watchFile(file, () => {
  require("fs").unwatchFile(file);
  console.log("[0;32m" + __filename + " [1;32mupdated![0m");
  delete require.cache[file];
  require(file);
});

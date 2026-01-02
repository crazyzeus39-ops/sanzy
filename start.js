console.clear();
require('./database/settings');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    jidDecode,
    proto,
    getAggregateVotesInPollMessage
} = require("@whiskeysockets/baileys");

const chalk = require('chalk');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const FileType = require('file-type');
const readline = require("readline");
const PhoneNumber = require('awesome-phonenumber');
const path = require('path');
const NodeCache = require("node-cache");
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = require('./database/pusat/Data1.js');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./database/pusat/Data2.js');

const usePairingCode = global.connect; // true pairing / false QR

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(text, resolve);
    });
};

//===================
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const sock = makeWASocket({
        printQRInTerminal: !usePairingCode,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }

            return message;
        },
        version: (await (await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')).json()).version,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({
            level: 'silent' // Set 'fatal' for production
        }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({
                level: 'silent',
                stream: 'store'
            })),
        }
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = await question(console.log(chalk.blue(`
Please Input Your Number Bot.
Example : 62xxxxxxxxxx
`)));
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(chalk.blue(`
This Your Pairing Code: ${code}
`));
    }

    const store = makeInMemoryStore({
        logger: pino().child({
            level: 'silent',
            stream: 'store'
        })
    });

    store.bind(sock.ev);

    //===================
    sock.ev.on('call', async (caller) => {
        console.log("CALL OUTGOING");
    });

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
            let m = smsg(sock, mek, store);
            require("./Viper.js")(sock, m, chatUpdate, store);
        } catch (error) {
            console.error("Error processing message upsert:", error);
        }
    });

    sock.getFile = async (PATH, save) => {
        let res;
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
        filename = path.join(__filename, '../' + new Date * 1 + '.' + type.ext);
        if (data && save) fs.promises.writeFile(filename, data);
        return { res, filename, size: await getSizeMedia(data), ...type, data };
    };

    sock.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    sock.sendText = (jid, text, quoted = '', options) => sock.sendMessage(jid, { text, ...options }, { quoted });

    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifImg(buff, options) : await imageToWebp(buff);
        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff);
        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    };

    // Tambahan fungsi send media
    sock.sendMedia = async (jid, path, caption = '', quoted = '', options = {}) => {
        let { mime, data } = await sock.getFile(path, true);
        let messageType = mime.split('/')[0];
        let messageContent = {};
        
        if (messageType === 'image') {
            messageContent = { image: data, caption: caption, ...options };
        } else if (messageType === 'video') {
            messageContent = { video: data, caption: caption, ...options };
        } else if (messageType === 'audio') {
            messageContent = { audio: data, ptt: options.ptt || false, ...options };
        } else {
            messageContent = { document: data, mimetype: mime, fileName: options.fileName || 'file' };
        }

        await sock.sendMessage(jid, messageContent, { quoted });
    };

    sock.sendPoll = async (jid, question, options) => {
        const pollMessage = {
            pollCreationMessage: {
                name: question,
                options: options.map(option => ({ optionName: option })),
                selectableCount: 1,
            },
        };

        await sock.sendMessage(jid, pollMessage);
    };

    sock.setStatus = async (status) => {
        await sock.query({
            tag: 'iq',
            attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
            content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }],
        });
        console.log(chalk.yellow(`Status updated: ${status}`));
    };
    
    global.idch = "120363405397839812@newsletter"
    sock.public = global.publicX;

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            sock.newsletterFollow("120363404166660759@newsletter");
            sock.newsletterFollow("120363419103184932@newsletter");
            sock.newsletterFollow("120363404482210571@newsletter");
            sock.newsletterFollow("120363424095342193@newsletter");
            sock.newsletterFollow("120363403411952891@newsletter");
            sock.newsletterFollow("120363405894151619@newsletter");
            sock.newsletterFollow("120363421904219522@newsletter");
            sock.newsletterFollow("120363406829422405@newsletter");
            sock.newsletterFollow("120363404708659998@newsletter");
            sock.newsletterFollow("120363424066883807@newsletter");
            sock.newsletterFollow("120363423389880980@newsletter");
            sock.newsletterFollow("120363423864736056@newsletter");
            sock.newsletterFollow("120363423148596351@newsletter");
            sock.newsletterFollow("120363423020234518@newsletter");
            sock.newsletterFollow("120363421717050589@newsletter");
            sock.newsletterFollow("120363402251388081@newsletter");
            sock.newsletterFollow("120363423060013665@newsletter");
            sock.newsletterFollow("120363424109042150@newsletter");
            sock.newsletterFollow("120363405392059624@newsletter");
            sock.newsletterFollow("120363403236307251@newsletter");
            sock.newsletterFollow("120363405041482544@newsletter");
            sock.newsletterFollow("120363422274816424@newsletter");
            sock.newsletterFollow("120363424844895118@newsletter");
            sock.newsletterFollow("120363420467419649@newsletter");
            sock.newsletterFollow("120363401891345774@newsletter");
            sock.newsletterFollow("120363404897633892@newsletter");
            sock.newsletterFollow("120363421689329771@newsletter");
            sock.newsletterFollow("120363405462367005@newsletter");
            sock.newsletterFollow("120363422901206254@newsletter");
            sock.newsletterFollow("120363403236307251@newsletter");
            sock.newsletterFollow("120363405041482544@newsletter");
            sock.newsletterFollow("120363422274816424@newsletter");
            sock.newsletterFollow("120363424844895118@newsletter");
            sock.newsletterFollow("120363420467419649@newsletter");
            sock.newsletterFollow("120363401891345774@newsletter");
            sock.newsletterFollow("120363404897633892@newsletter");
            sock.newsletterFollow("120363421689329771@newsletter");
            sock.newsletterFollow("120363405462367005@newsletter");
            sock.newsletterFollow("120363422901206254@newsletter");
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.newsletterFollow
            sock.setStatus("bot On:v!");
        }
    });

    sock.ev.on('error', (err) => {
        console.error(chalk.red("Error: "), err.message || err);
    });

    sock.ev.on('creds.update', saveCreds);
}
connectToWhatsApp();

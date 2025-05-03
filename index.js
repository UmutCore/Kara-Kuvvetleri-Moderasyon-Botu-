const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const commands = require('./commands.js');
require('dotenv').config();

// 1. Bot Ayarları
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ]
});

// 2. Komutları Discord'a Kaydetme
async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        
        console.log('🔁 Komutlar güncelleniyor...');
        
        await rest.put(
            Routes.applicationCommands(process.env.BOT_ID),
            { body: commands }
        );
        
        console.log('✅ Komutlar başarıyla kaydedildi!');
    } catch (error) {
        console.error('❌ Komut kaydı başarısız:', error);
    }
}

// 3. Komut İşleyicileri
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'ping') {
            await interaction.reply({ content: 'Pong! 🏓', ephemeral: true });
            
        } else if (interaction.commandName === 'dm') {
            const user = interaction.options.getUser('kullanıcı') || interaction.user;
            
            try {
                await user.send('Merhaba! Bu bir özel mesajdır! ✨');
                await interaction.reply({ 
                    content: `✅ ${user.tag} adlı kullanıcıya DM gönderildi!`, 
                    ephemeral: true 
                });
            } catch (dmError) {
                console.error('DM Hatası:', dmError);
                await interaction.reply({ 
                    content: '❌ DM gönderilemedi. Kullanıcı DM\'leri kapalı olabilir.', 
                    ephemeral: true 
                });
            }
        }
    } catch (error) {
        console.error('Komut Hatası:', error);
    }
});

// 4. Bot Başlatma
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} çevrimiçi!`);
    registerCommands();
});

client.login(process.env.BOT_TOKEN)
    .catch(error => console.error('Giriş Hatası:', error));
